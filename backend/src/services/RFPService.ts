import { PrismaClient } from "@prisma/client";
import PDFParser from "pdf2json";
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { PDFDocument, rgb, StandardFonts, PDFPage } from "pdf-lib";

dotenv.config();

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sanitizeFileName = (title: string) =>
  title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");

export class RFPService {

  static async upload(req: any, userId: number) {
    if (!req.file) throw new Error("No file uploaded");

    const uploadsFolder = path.join(__dirname, "..", "..", "uploads", "rfps", "generated");
    await fs.mkdir(uploadsFolder, { recursive: true });

    const fileName = `${sanitizeFileName(req.file.originalname)}-${Date.now()}${path.extname(req.file.originalname)}`;
    const filePath = path.join(uploadsFolder, fileName);
    await fs.rename(req.file.path, filePath);

    const relativePath = path.relative(path.join(__dirname, "..", ".."), filePath).replace(/\\/g, "/");

    const rfp = await prisma.rFP.create({
      data: { title: req.file.originalname, filePath: relativePath, userId, status: "PENDING" }
    });

    return { id: rfp.id, title: rfp.title, filePath: rfp.filePath, status: rfp.status };
  }

  static async updateRFP(rfpId: number, userId: number, data: { title?: string; description?: string; category?: string; status?: string }) {
    const rfp = await prisma.rFP.findUnique({ where: { id: rfpId } });
    if (!rfp) throw new Error("RFP not found");
    if (rfp.userId !== userId) throw new Error("Unauthorized");

    // Validate status if provided
    const validStatuses = ["DRAFT", "PENDING", "ANALYZED", "IN_PROGRESS", "COMPLETED"];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error(`Invalid status: ${data.status}. Must be one of: ${validStatuses.join(", ")}`);
    }

    const updatedRfp = await prisma.rFP.update({
      where: { id: rfpId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.status && { status: data.status as "DRAFT" | "PENDING" | "ANALYZED" | "IN_PROGRESS" | "COMPLETED" }),
      },
    });

    // Create activity log
    const activityDetails: string[] = [];
    if (data.title) activityDetails.push(`updated title`);
    if (data.description !== undefined) activityDetails.push(`updated description`);
    if (data.category !== undefined) activityDetails.push(`updated category`);
    if (data.status) activityDetails.push(`changed status to ${data.status}`);

    if (activityDetails.length > 0) {
      await prisma.rFPActivity.create({
        data: {
          rfpId,
          userId,
          action: "updated",
          details: activityDetails.join(", "),
        },
      });
    }

    return updatedRfp;
  }

  static async createDraft(title: string, description: string | undefined, category: string | undefined, userId: number, aiPrompt?: string) {
    // Create a placeholder file path for drafts (will be updated when submitted)
    const uploadsFolder = path.join(__dirname, "..", "..", "uploads", "rfps", "generated");
    await fs.mkdir(uploadsFolder, { recursive: true });
    
    const fileName = `draft-${sanitizeFileName(title)}-${Date.now()}.txt`;
    const filePath = path.join(uploadsFolder, fileName);
    
    // Create a placeholder file with draft content
    const draftContent = `DRAFT RFP\nTitle: ${title}\nDescription: ${description || ""}\nCategory: ${category || ""}\nAI Prompt: ${aiPrompt || ""}`;
    await fs.writeFile(filePath, draftContent);

    const relativePath = path.relative(path.join(__dirname, "..", ".."), filePath).replace(/\\/g, "/");

    const rfp = await prisma.rFP.create({
      data: { 
        title, 
        description: description || "", 
        category: category || "", 
        filePath: relativePath, 
        userId, 
        status: "DRAFT" as "DRAFT" | "PENDING" | "ANALYZED" | "IN_PROGRESS" | "COMPLETED"
      },
    });

    return { id: rfp.id, title: rfp.title, filePath: rfp.filePath, status: rfp.status };
  }

  static async deleteRFP(rfpId: number, userId: number) {
    const rfp = await prisma.rFP.findUnique({ where: { id: rfpId } });
    if (!rfp) throw new Error("RFP not found");
    if (rfp.userId !== userId) throw new Error("Unauthorized to delete this RFP");

    await prisma.rFPCollaborator.deleteMany({ where: { rfpId } });
    await prisma.question.deleteMany({ where: { rfpId } });

    const filePath = path.join(__dirname, "..", "..", rfp.filePath);
    try { await fs.unlink(filePath); } catch {}

    await prisma.rFP.delete({ where: { id: rfpId } });
    return { message: "RFP deleted successfully" };
  }

  static async getAll(userId: number) {
    const rfps = await prisma.rFP.findMany({
      where: { userId },
      include: {
        questions: true,
        collaborators: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return rfps.map((rfp) => ({
      ...rfp,
      questions: rfp.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        aiSuggestedAnswer: q.aiSuggestedAnswer || "",
        userEditedAnswer: q.userEditedAnswer || "",
      })),
    }));
  }

static async analyze(rfpId: number, aiPrompt?: string) {
  // ---------------- Validate RFP ----------------
  const rfp = await prisma.rFP.findUnique({ where: { id: rfpId } });
  if (!rfp) throw new Error("RFP not found");

  const fullPath = path.join(__dirname, "..", "..", rfp.filePath);

  // ---------------- Extract PDF Text ----------------
  const pdfText: string = await new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData) =>
      reject((errData as any)?.parserError || errData)
    );

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        const text = pdfData.Pages.map((page: any) =>
          page.Texts.map((t: any) => decodeURIComponent(t.R[0].T)).join(" ")
        ).join("\n");

        resolve(text);
      } catch (err) {
        reject(err);
      }
    });

    pdfParser.loadPDF(fullPath);
  });

  // ---------------- Chunk Large PDF ----------------
  const MAX_CHUNK = 12000;
  const chunks: string[] = [];

  for (let i = 0; i < pdfText.length; i += MAX_CHUNK) {
    chunks.push(pdfText.slice(i, i + MAX_CHUNK));
  }

  // ---------------- Instruction for AI ----------------
  const instruct = (chunk: string, isFirstChunk: boolean = false) => {
    const promptEnhancement = aiPrompt ? `\n\nADDITIONAL REQUIREMENTS/ENHANCEMENTS:\n${aiPrompt}\n\nPlease incorporate these requirements when generating questions and suggestions.` : '';
    
    return `
You are an AI assistant that analyzes RFP documents. Your task is to:

1. EXTRACT all existing questions that are already in the document (look for question marks, numbered questions, "Q:", "Vendor Questions", bullet points with "?", etc.)
2. GENERATE additional clarifying questions based on the content, gaps, and best practices
3. Provide suggestions for missing items

Return ONLY valid JSON:

{
  "summary": "1 short paragraph summary of the entire RFP",
  "key_requirements": ["List of key requirements mentioned"],
  "sections": ["List of section names found in the document"],
  "questions": [
      {
        "question": "Extract existing questions from the document OR generate new clarifying questions",
        "suggestedAnswer": "Short 1-2 line AI answer based on document content",
        "section": "Section name if question belongs to a specific section",
        "isExtracted": true or false (true if question was found in document, false if generated)
      }
  ],
  "risks": ["Potential risks or concerns identified"],
  "missing_items": ["Important items that should be included but are missing"],
  "suggestions": ["Additional questions or requirements that would strengthen this RFP"]
}

CRITICAL EXTRACTION RULES:
- Look for sections titled "Questions", "Vendor Questions", "Proposal Questions", "Requirements", etc.
- Extract questions that end with "?" or are in numbered/bulleted lists
- Look for patterns like: "What...?", "How...?", "Which...?", "When...?", "Where...?", "Who...?", "Why...?"
- Extract questions even if they're embedded in paragraphs or lists
- For each extracted question, set "isExtracted": true
- Generate at least 5-10 additional clarifying questions based on gaps, unclear areas, and best practices
- Set "isExtracted": false for AI-generated questions
- Include suggestions from "missing_items" as additional questions if relevant
- Generate questions about: technical specifications, timeline, budget, support, security, compliance, integration, scalability, etc.
${promptEnhancement}

RFP TEXT:
${chunk}
`;
  };

  // ---------------- Prepare Aggregated Structure ----------------
  let aggregated = {
    summary: "",
    key_requirements: [] as string[],
    sections: [] as string[],
    questions: [] as {
      question: string;
      suggestedAnswer: string;
      section?: string;
      isExtracted?: boolean;
    }[],
    risks: [] as string[],
    missing_items: [] as string[],
  };

  // ---------------- Process Chunk by Chunk ----------------
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isFirstChunk = i === 0;
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: instruct(chunk, isFirstChunk) }],
      temperature: 0,
    });

    let content = aiResponse.choices?.[0]?.message?.content || "{}";

    // ---------------- Robust JSON Parse ----------------
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        summary: content,
        key_requirements: [],
        sections: [],
        questions: [],
        risks: [],
        missing_items: [],
      };
    }

    // ---------------- Merging ----------------
    aggregated.summary +=
      (aggregated.summary ? "\n\n" : "") + (parsed.summary || "");

    aggregated.key_requirements.push(...(parsed.key_requirements || []));
    aggregated.sections.push(...(parsed.sections || []));
    aggregated.questions.push(...(parsed.questions || []));
    aggregated.risks.push(...(parsed.risks || []));
    aggregated.missing_items.push(...(parsed.missing_items || []));
    
    // Convert suggestions to questions if provided
    if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
      parsed.suggestions.forEach((suggestion: string) => {
        if (suggestion.trim()) {
          aggregated.questions.push({
            question: suggestion.trim(),
            suggestedAnswer: "To be determined based on project requirements",
            section: null,
            isExtracted: false,
          });
        }
      });
    }
  }

  // ---------------- Remove Duplicate Text ----------------
  const unique = (arr: string[]) =>
    Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));

  // Convert missing_items to questions if they're not already questions
  aggregated.missing_items.forEach((item: string) => {
    if (item.trim() && !aggregated.questions.some((q: any) => 
      q.question.toLowerCase().includes(item.toLowerCase().slice(0, 20))
    )) {
      aggregated.questions.push({
        question: `Should this RFP include: ${item.trim()}?`,
        suggestedAnswer: "To be determined based on project requirements",
        section: null,
        isExtracted: false,
      });
    }
  });

  const finalQuestions = aggregated.questions
    .map((q: any) => ({
      question: (q.question || "").trim(),
      suggestedAnswer: (q.suggestedAnswer || "").trim(),
      section: q.section?.trim() || null,
      isExtracted: q.isExtracted !== undefined ? q.isExtracted : false,
    }))
    .filter((q) => q.question.length > 0);

  // ---------------- Save Questions to DB ----------------
  await prisma.question.deleteMany({ where: { rfpId } });

  if (finalQuestions.length > 0) {
    await prisma.question.createMany({
      data: finalQuestions.map((q) => ({
        rfpId,
        questionText: q.question,
        aiSuggestedAnswer: q.suggestedAnswer,
        section: q.section,
      })),
    });
  }

  // ---------------- Update RFP Summary & Status ----------------
  const summaryToStore = aggregated.summary.trim().slice(0, 5000);

  await prisma.rFP.update({
    where: { id: rfpId },
    data: { status: "ANALYZED", description: summaryToStore },
  });

  // ---------------- Final Response ----------------
  const extractedCount = finalQuestions.filter((q: any) => q.isExtracted).length;
  const generatedCount = finalQuestions.filter((q: any) => !q.isExtracted).length;

  return {
    message: "RFP analyzed successfully",
    summary: aggregated.summary.trim(),
    key_requirements: unique(aggregated.key_requirements),
    sections: unique(aggregated.sections),
    questions: finalQuestions.map((q: any) => ({
      question: q.question,
      suggestedAnswer: q.suggestedAnswer,
      section: q.section,
      // Don't include isExtracted in response, it's internal
    })),
    risks: unique(aggregated.risks),
    missing_items: unique(aggregated.missing_items),
    stats: {
      totalQuestions: finalQuestions.length,
      extractedQuestions: extractedCount,
      generatedQuestions: generatedCount,
    },
  };
}


static async getQuestions(rfpId: number) {
  const rfp = await prisma.rFP.findUnique({
    where: { id: rfpId },
    include: {
      questions: {
        select: {
          id: true,
          questionText: true,
          aiSuggestedAnswer: true,
          userEditedAnswer: true,
          finalAnswer: true, // New field (backward compatible)
          section: true,
          status: true, // New field (backward compatible)
          complianceStatus: true, // New field (backward compatible)
          confidenceScore: true, // New field (backward compatible)
          assignedEditorId: true, // New field (backward compatible)
          assignedReviewerId: true, // New field (backward compatible)
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!rfp) throw new Error("RFP not found");

  // Map DB Question rows to API-friendly shape (backward compatible)
  const questions = (rfp.questions || []).map((q) => ({
    id: q.id,
    questionText: q.questionText,
    aiSuggestedAnswer: q.aiSuggestedAnswer || "",
    userEditedAnswer: q.userEditedAnswer || "",
    finalAnswer: q.finalAnswer || null, // New field
    section: q.section || null,
    status: q.status || "DRAFT", // New field with default
    complianceStatus: q.complianceStatus || null, // New field
    confidenceScore: q.confidenceScore || null, // New field
    assignedEditorId: q.assignedEditorId || null, // New field
    assignedReviewerId: q.assignedReviewerId || null, // New field
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  }));

  // Return standardized object: { summary, questions }
  // Backward compatible - existing frontend code will still work
  return {
    summary: rfp.description || "",
    questions,
  };
}


  static async generateAI(title: string, description: string, category: string, prompt: string, userId: number) {
    if (!prompt) throw new Error("Prompt is required");

    const aiPrompt = `
Generate a professional RFP document based on:
Title: ${title}
Category: ${category}
Description: ${description}
Requirements / Details: ${prompt}

Return ONLY plain text.
    `;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: aiPrompt }],
      temperature: 0.3,
    });

    const rfpText = aiResponse.choices[0].message?.content;
    if (!rfpText) throw new Error("AI failed to generate RFP");

    const uploadsFolder = path.join(__dirname, "..", "..", "uploads", "rfps", "generated");
    await fs.mkdir(uploadsFolder, { recursive: true });

    const fileName = `${sanitizeFileName(title)}-${Date.now()}.pdf`;
    const filePath = path.join(uploadsFolder, fileName);

    // Create well-formatted PDF
    const pdfDoc = await PDFDocument.create();
    
    // Embed fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let y = height - 60;
    const margin = 60;
    const maxWidth = width - (margin * 2);
    const lineHeight = 14;
    const paragraphSpacing = 8;
    
    // Helper function to wrap text and add to page
    const addWrappedText = (text: string, fontSize: number, isBold: boolean, textColor: any, extraSpacing: number = 0) => {
      const font = isBold ? helveticaBold : helvetica;
      const words = text.split(" ");
      let currentLine = "";
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth > maxWidth && currentLine) {
          // Need new line - draw current line first
          if (y < 80) {
            page = pdfDoc.addPage();
            y = height - 60;
          }
          page.drawText(currentLine, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: textColor,
          });
          y -= (fontSize + extraSpacing);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      // Draw remaining line
      if (currentLine) {
        if (y < 80) {
          page = pdfDoc.addPage();
          y = height - 60;
        }
        page.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: textColor,
        });
        y -= (fontSize + extraSpacing);
      }
    };
    
    // Title (centered, large, bold)
    const titleWidth = helveticaBold.widthOfTextAtSize(title, 24);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y,
      size: 24,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    y -= 40;
    
    // Divider line
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= 25;
    
    // Metadata section
    if (category) {
      addWrappedText(`Category: ${category}`, 10, false, rgb(0.4, 0.4, 0.4), 2);
    }
    addWrappedText(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 10, false, rgb(0.4, 0.4, 0.4), 2);
    y -= 15;
    
    // Description section
    if (description) {
      addWrappedText("Description", 16, true, rgb(0, 0, 0), 4);
      y -= 5;
      addWrappedText(description, 11, false, rgb(0.2, 0.2, 0.2), paragraphSpacing);
      y -= 10;
    }
    
    // Parse and format RFP content with better structure
    const lines = rfpText.split("\n").filter(l => l.trim());
    let inParagraph = false;
    let paragraphText = "";
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (paragraphText) {
          addWrappedText(paragraphText, 11, false, rgb(0.2, 0.2, 0.2), paragraphSpacing);
          paragraphText = "";
          inParagraph = false;
          y -= 5;
        }
        continue;
      }
      
      // Check if it's a heading
      const isHeading = /^#+\s/.test(line) || 
                       /^(Executive Summary|Introduction|Background|Scope of Work|Requirements|Timeline|Budget|Deliverables|Evaluation Criteria|Contact Information|Project Overview|Technical Requirements|Submission Guidelines)/i.test(line) ||
                       (line.length < 80 && line === line.toUpperCase() && line.split(" ").length <= 6);
      
      if (isHeading) {
        // Flush any pending paragraph
        if (paragraphText) {
          addWrappedText(paragraphText, 11, false, rgb(0.2, 0.2, 0.2), paragraphSpacing);
          paragraphText = "";
          y -= 5;
        }
        
        // Add heading
        const headingText = line.replace(/^#+\s*/, "").trim();
        y -= 10; // Extra space before heading
        if (y < 100) {
          page = pdfDoc.addPage();
          y = height - 60;
        }
        addWrappedText(headingText, 16, true, rgb(0, 0, 0), 6);
        y -= 5;
        inParagraph = false;
      } else {
        // Regular text - accumulate into paragraph
        if (paragraphText) {
          paragraphText += " " + line;
        } else {
          paragraphText = line;
        }
        inParagraph = true;
      }
    }
    
    // Flush remaining paragraph
    if (paragraphText) {
      addWrappedText(paragraphText, 11, false, rgb(0.2, 0.2, 0.2), paragraphSpacing);
    }

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(filePath, pdfBytes);

    const relativePath = path.relative(path.join(__dirname, "..", ".."), filePath).replace(/\\/g, "/");

    const rfp = await prisma.rFP.create({
      data: { title, description, category, filePath: relativePath, userId, status: "ANALYZED" },
    });

    return { id: rfp.id, title: rfp.title, filePath: rfp.filePath, status: rfp.status };
  }

  static async getAllRFPsWithCollaborators(userId: number) {
    // Get RFPs where user is the owner OR a collaborator (with ACCEPTED status)
    const ownedRfps = await prisma.rFP.findMany({
      where: { userId },
      include: {
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get RFPs where user is a collaborator (ACCEPTED status)
    const collaborationRecords = await prisma.rFPCollaborator.findMany({
      where: {
        userId,
        status: "ACCEPTED",
      },
      include: {
        rfp: {
          include: {
            collaborators: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    avatar: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Combine owned RFPs and collaborated RFPs, removing duplicates
    const ownedRfpIds = new Set(ownedRfps.map(r => r.id));
    const collaboratedRfps = collaborationRecords
      .map(c => c.rfp)
      .filter(rfp => !ownedRfpIds.has(rfp.id)); // Exclude RFPs already in owned list

    const allRfps = [...ownedRfps, ...collaboratedRfps];

    const baseUrl = process.env.BASE_URL || "http://localhost:5001";

    return allRfps.map(rfp => ({
      ...rfp,
      collaborators: rfp.collaborators.map(collab => ({
        id: collab.user.id,
        name: collab.user.name,
        email: collab.user.email,
        role: collab.role,
        status: collab.status,
        avatar: collab.user.avatar ? `${baseUrl}${collab.user.avatar}` : null,
      })),
    }));
  }

  static async getCollaborators(rfpId: number) {
    const collaborators = await prisma.rFPCollaborator.findMany({
      where: { rfpId },
      include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } },
      orderBy: { invitedAt: "desc" },
    });

    const baseUrl = process.env.BASE_URL || "http://localhost:5001";

    return collaborators.map((c) => ({
      id: c.user.id,
      name: c.user.name,
      email: c.user.email,
      role: c.role,
      status: c.status,
      avatar: c.user.avatar ? `${baseUrl}${c.user.avatar}` : null,
      invitedAt: c.invitedAt,
      acceptedAt: c.acceptedAt,
    }));
  }

  static async addCollaborator(rfpId: number, email: string, requesterId: number) {
    const collaboratorUser = await prisma.user.findUnique({ where: { email } });
    if (!collaboratorUser) throw new Error("User not found");
    if (collaboratorUser.id === requesterId) throw new Error("You cannot add yourself");

    const exists = await prisma.rFPCollaborator.findUnique({
      where: { rfpId_userId: { rfpId, userId: collaboratorUser.id } },
    });
    if (exists) throw new Error("Already a collaborator");

    // Get RFP details for email
    const rfp = await prisma.rFP.findUnique({ where: { id: rfpId }, include: { user: true } });
    if (!rfp) throw new Error("RFP not found");

    const created = await prisma.rFPCollaborator.create({
      data: {
        rfpId,
        userId: collaboratorUser.id,
        role: "VIEWER", // Use enum value instead of string
        status: "INVITED",
        invitedAt: new Date(),
      },
      include: { user: true, rfp: { include: { user: true } } },
    });

    // Send invitation email
    try {
      const EmailService = (await import("./EmailService")).default;
      const emailService = new EmailService();
      
      // Check if email service is configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.warn("⚠️ Email service not configured. SMTP credentials missing. Invitation email not sent.");
        console.warn("   Collaborator was added successfully, but they won't receive an email notification.");
        console.warn("   To enable emails, set SMTP_USER and SMTP_PASSWORD in your .env file.");
      } else {
        const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard?tab=collaborators`;
        console.log(`📧 Sending collaboration invite email to: ${collaboratorUser.email}`);
        await emailService.sendCollaboratorInvite(
          collaboratorUser.email,
          collaboratorUser.name || "User",
          rfp.title,
          rfp.user.name || "RFP Owner",
          inviteLink
        );
        console.log(`✅ Collaboration invite email sent successfully to: ${collaboratorUser.email}`);
      }
    } catch (emailErr: any) {
      console.error("❌ Failed to send invitation email:", emailErr);
      console.error("   Error details:", emailErr.message || emailErr);      
    }

    // Create activity log
    await prisma.rFPActivity.create({
      data: {
        rfpId,
        userId: requesterId,
        action: "added_collaborator",
        details: `Added ${collaboratorUser.name} as a collaborator`,
      },
    });

    return {
      message: "Collaborator invited successfully",
      collaborator: {
        id: created.user.id,
        name: created.user.name,
        email: created.user.email,
        role: created.role,
        status: created.status,
      },
    };
  }

  static async acceptInvite(rfpId: number, userId: number) {
    const collaboration = await prisma.rFPCollaborator.findUnique({
      where: { rfpId_userId: { rfpId, userId } },
    });

    if (!collaboration) throw new Error("Invitation not found");
    if (collaboration.status !== "INVITED") throw new Error("Invitation already processed");

    const updated = await prisma.rFPCollaborator.update({
      where: { rfpId_userId: { rfpId, userId } },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
      include: { user: true, rfp: true },
    });

    // Create activity log
    await prisma.rFPActivity.create({
      data: {
        rfpId,
        userId,
        action: "accepted_invite",
        details: `Accepted collaboration invitation`,
      },
    });

    return {
      message: "Invitation accepted",
      collaboration: {
        rfpId: updated.rfpId,
        rfpTitle: updated.rfp.title,
        status: updated.status,
      },
    };
  }

  static async rejectInvite(rfpId: number, userId: number) {
    const collaboration = await prisma.rFPCollaborator.findUnique({
      where: { rfpId_userId: { rfpId, userId } },
    });

    if (!collaboration) throw new Error("Invitation not found");
    if (collaboration.status !== "INVITED") throw new Error("Invitation already processed");

    // Delete the collaboration record when rejected
    await prisma.rFPCollaborator.delete({
      where: { rfpId_userId: { rfpId, userId } },
    });

    return {
      message: "Invitation rejected",
      rfpId,
    };
  }

  static async getPendingInvites(userId: number) {
    const invites = await prisma.rFPCollaborator.findMany({
      where: {
        userId,
        status: "INVITED",
      },
      include: {
        rfp: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { invitedAt: "desc" },
    });

    return invites.map((invite) => ({
      id: invite.id,
      rfpId: invite.rfpId,
      rfpTitle: invite.rfp.title,
      rfpDescription: invite.rfp.description,
      ownerName: invite.rfp.user.name,
      ownerEmail: invite.rfp.user.email,
      role: invite.role,
      invitedAt: invite.invitedAt,
    }));
  }

  static async removeCollaborator(rfpId: number, userId: number) {
    await prisma.rFPCollaborator.delete({ where: { rfpId_userId: { rfpId, userId } } });
    return { message: "Collaborator removed" };
  }

  static async getComments(rfpId: number, userId: number) {
    // Check if user has access (owner or accepted collaborator)
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        collaborators: {
          where: {
            userId,
            status: "ACCEPTED",
          },
        },
      },
    });

    if (!rfp) throw new Error("RFP not found");
    if (rfp.userId !== userId && rfp.collaborators.length === 0) {
      throw new Error("Unauthorized: You don't have access to this RFP");
    }

    const comments = await prisma.rFPComment.findMany({
      where: { rfpId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const baseUrl = process.env.BASE_URL || "http://localhost:5001";

    return comments.map((comment) => ({
      id: comment.id,
      userId: comment.user.id,
      userName: comment.user.name,
      userAvatar: comment.user.avatar ? `${baseUrl}${comment.user.avatar}` : null,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    }));
  }

  static async addComment(rfpId: number, userId: number, content: string) {
    // Check if user has access (owner or accepted collaborator)
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        collaborators: {
          where: {
            userId,
            status: "ACCEPTED",
          },
        },
      },
    });

    if (!rfp) throw new Error("RFP not found");
    if (rfp.userId !== userId && rfp.collaborators.length === 0) {
      throw new Error("Unauthorized: You don't have access to comment on this RFP");
    }

    if (!content || !content.trim()) {
      throw new Error("Comment content cannot be empty");
    }

    const comment = await prisma.rFPComment.create({
      data: {
        rfpId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    const baseUrl = process.env.BASE_URL || "http://localhost:5001";

    // Create activity log for comment
    await prisma.rFPActivity.create({
      data: {
        rfpId,
        userId,
        action: "commented",
        details: `Added a comment`,
      },
    });

    return {
      id: comment.id,
      userId: comment.user.id,
      userName: comment.user.name,
      userAvatar: comment.user.avatar ? `${baseUrl}${comment.user.avatar}` : null,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  static async getActivities(rfpId: number, userId: number) {
    // Check if user has access (owner or accepted collaborator)
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        collaborators: {
          where: {
            userId,
            status: "ACCEPTED",
          },
        },
      },
    });

    if (!rfp) throw new Error("RFP not found");
    if (rfp.userId !== userId && rfp.collaborators.length === 0) {
      throw new Error("Unauthorized: You don't have access to this RFP");
    }

    const activities = await prisma.rFPActivity.findMany({
      where: { rfpId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to last 50 activities
    });

    const baseUrl = process.env.BASE_URL || "http://localhost:5001";

    return activities.map((activity) => ({
      id: activity.id,
      userId: activity.user.id,
      userName: activity.user.name,
      userAvatar: activity.user.avatar ? `${baseUrl}${activity.user.avatar}` : null,
      action: activity.action,
      details: activity.details,
      createdAt: activity.createdAt.toISOString(),
    }));
  }

  static async createActivity(rfpId: number, userId: number, action: string, details?: string) {
    // Check if user has access (owner or accepted collaborator)
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        collaborators: {
          where: {
            userId,
            status: "ACCEPTED",
          },
        },
      },
    });

    if (!rfp) throw new Error("RFP not found");
    if (rfp.userId !== userId && rfp.collaborators.length === 0) {
      throw new Error("Unauthorized: You don't have access to this RFP");
    }

    const activity = await prisma.rFPActivity.create({
      data: {
        rfpId,
        userId,
        action,
        details: details || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    const baseUrl = process.env.BASE_URL || "http://localhost:5001";

    return {
      id: activity.id,
      userId: activity.user.id,
      userName: activity.user.name,
      userAvatar: activity.user.avatar ? `${baseUrl}${activity.user.avatar}` : null,
      action: activity.action,
      details: activity.details,
      createdAt: activity.createdAt.toISOString(),
    };
  }
}
