//
// RFP SERVICE — FULLY FIXED AND CLEANED
//

import { PrismaClient } from "@prisma/client";
import PDFParser from "pdf2json";
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy-key" });

const sanitizeFileName = (title: string) =>
  title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");

export class RFPService {
  // ===============================
  // 📤 UPLOAD RFP
  // ===============================
  static async upload(req: any, userId: number) {
    if (!req.file) throw new Error("No file uploaded");

    const uploadsFolder = path.join(__dirname, "..", "..", "uploads", "rfps", "generated");
    await fs.mkdir(uploadsFolder, { recursive: true });

    const fileName = `${sanitizeFileName(req.file.originalname)}-${Date.now()}${path.extname(req.file.originalname)}`;
    const filePath = path.join(uploadsFolder, fileName);

    await fs.rename(req.file.path, filePath);

    const relativePath = path.relative(path.join(__dirname, "..", ".."), filePath).replace(/\\/g, "/");

    const rfp = await prisma.rFP.create({
      data: {
        title: req.file.originalname,
        filePath: relativePath,
        userId: Number(userId),
        status: "PENDING",
      },
    });

    return {
      id: rfp.id,
      title: rfp.title,
      filePath: rfp.filePath,
      status: rfp.status,
    };
  }

  // ===============================
  // ❌ DELETE RFP
  // ===============================
  static async deleteRFP(rfpId: number, userId: number) {
    const rfp = await prisma.rFP.findUnique({ where: { id: rfpId } });
    if (!rfp) throw new Error("RFP not found");
    if (rfp.userId !== userId) throw new Error("Unauthorized to delete this RFP");

    // Delete collaborators & questions
    await prisma.rFPCollaborator.deleteMany({ where: { rfpId } });
    await prisma.question.deleteMany({ where: { rfpId } });

    // Delete physical file
    const filePath = path.join(__dirname, "..", "..", rfp.filePath);
    try {
      await fs.unlink(filePath);
    } catch {}

    await prisma.rFP.delete({ where: { id: rfpId } });

    return { message: "RFP deleted successfully" };
  }

  // ===============================
  // 📄 GET ALL RFPs
  // ===============================
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

  // ===============================
  // 🧠 ANALYZE RFP
  // ===============================
//   static async analyze(rfpId: number) {
//     const rfp = await prisma.rFP.findUnique({ where: { id: rfpId } });
//     if (!rfp) throw new Error("RFP not found");

//     const fullPath = path.join(__dirname, "..", "..", rfp.filePath);

//     // Extract PDF text
//     const pdfText: string = await new Promise((resolve, reject) => {
//       const pdfParser = new PDFParser();

//       pdfParser.on("pdfParser_dataError", (errData) =>
//         reject((errData as any)?.parserError || errData)
//       );

//       pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
//         try {
//           const text = pdfData.Pages.map((page: any) =>
//             page.Texts.map((t: any) => decodeURIComponent(t.R[0].T)).join(" ")
//           ).join("\n");
//           resolve(text);
//         } catch (err) {
//           reject(err);
//         }
//       });

//       pdfParser.loadPDF(fullPath);
//     });

//     // AI analysis
//     const prompt = `
// Extract the following from this RFP:

// 1. Summary
// 2. Key Requirements (as bullet points)
// 3. Sections (as bullet points)
// 4. Important Questions (as bullet points)

// Return **ONLY JSON** formatted like:

// {
//   "summary": "...",
//   "key_requirements": ["..."],
//   "sections": ["..."],
//   "questions": ["..."]
// }

// RFP CONTENT:
// ${pdfText.substring(0, 12000)}
//     `;

//     const aiResponse = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0,
//     });

//     const content = aiResponse.choices[0].message?.content || "{}";

//     let parsed;
//     try {
//       parsed = JSON.parse(content);
//     } catch {
//       parsed = { summary: content, key_requirements: [], sections: [], questions: [] };
//     }

//     const { summary = "", key_requirements = [], sections = [], questions = [] } = parsed;

//     // Save questions with AI answer
//     if (Array.isArray(questions) && questions.length > 0) {
//       await prisma.question.createMany({
//         data: questions.map((q: string) => ({ questionText: q, aiSuggestedAnswer: q, rfpId })),
//       });
//     }

//     // Update RFP status
//     await prisma.rFP.update({
//       where: { id: rfpId },
//       data: { status: "ANALYZED", description: summary },
//     });

//     return { message: "RFP analyzed successfully", summary, key_requirements, sections, questions };
//   }

  static async analyze(rfpId: number) {
    const rfp = await prisma.rFP.findUnique({ where: { id: rfpId } });
    if (!rfp) throw new Error("RFP not found");

    const fullPath = path.join(__dirname, "..", "..", rfp.filePath);

    // Extract PDF text
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

    // AI analysis
    const prompt = `
Extract the following from this RFP:

1. Summary
2. Key Requirements (as bullet points)
3. Sections (as bullet points)
4. Important Questions (as bullet points)

Return **ONLY JSON** formatted like:

{
  "summary": "...",
  "key_requirements": ["..."],
  "sections": ["..."],
  "questions": ["..."]
}

RFP CONTENT:
${pdfText.substring(0, 12000)}
    `;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const content = aiResponse.choices[0].message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { summary: content, key_requirements: [], sections: [], questions: [] };
    }

    const { summary = "", key_requirements = [], sections = [], questions = [] } = parsed;

    // Save questions with AI answer
    if (Array.isArray(questions) && questions.length > 0) {
      await prisma.question.createMany({
        data: questions.map((q: string) => ({
          questionText: q,
          aiSuggestedAnswer: q,
          rfpId,
        })),
      });
    }

    // Update RFP status
    await prisma.rFP.update({
      where: { id: rfpId },
      data: { status: "ANALYZED", description: summary },
    });

    return { message: "RFP analyzed successfully", summary, key_requirements, sections, questions };
  }

  // Fetch questions for frontend
  static async getQuestions(rfpId: number) {
    const questions = await prisma.question.findMany({
      where: { rfpId },
      select: {
        id: true,
        questionText: true,
        aiSuggestedAnswer: true,
        userEditedAnswer: true,
      },
    });
    return questions;
  }

  // ===============================
  // 🤖 GENERATE AI RFP
  // ===============================
  static async generateAI(title: string, description: string, category: string, prompt: string, userId: number) {
    if (!prompt) throw new Error("Prompt is required");

    const aiPrompt = `
Generate a professional RFP document based on:

Title: ${title}
Category: ${category}
Description: ${description}
Requirements / Details: ${prompt}

Return ONLY plain text of the RFP.
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

    const fileName = `${sanitizeFileName(title)}-${Date.now()}.txt`;
    const filePath = path.join(uploadsFolder, fileName);
    await fs.writeFile(filePath, rfpText);

    const relativePath = path.relative(path.join(__dirname, "..", ".."), filePath).replace(/\\/g, "/");

    const rfp = await prisma.rFP.create({
      data: { title, description, category, filePath: relativePath, userId, status: "ANALYZED" },
    });

    return { id: rfp.id, title: rfp.title, filePath: rfp.filePath, status: rfp.status };
  }

  // ===============================
  // 👥 GET COLLABORATORS
  // ===============================
  static async getCollaborators(rfpId: number) {
    const collaborators = await prisma.rFPCollaborator.findMany({
      where: { rfpId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    return collaborators.map((c) => ({
      id: c.user.id,
      name: c.user.name,
      email: c.user.email,
      role: c.role,
    }));
  }

  // ===============================
  // ➕ ADD COLLABORATOR
  // ===============================
  static async addCollaborator(rfpId: number, email: string, requesterId: number) {
    const collaboratorUser = await prisma.user.findUnique({ where: { email } });
    if (!collaboratorUser) throw new Error("User not found");
    if (collaboratorUser.id === requesterId) throw new Error("You cannot add yourself");

    const exists = await prisma.rFPCollaborator.findUnique({
      where: { rfpId_userId: { rfpId, userId: collaboratorUser.id } },
    });
    if (exists) throw new Error("Already a collaborator");

    const created = await prisma.rFPCollaborator.create({
      data: { rfpId, userId: collaboratorUser.id, role: "Collaborator" },
      include: { user: true },
    });

    return {
      message: "Collaborator added",
      collaborator: { id: created.user.id, name: created.user.name, email: created.user.email, role: created.role },
    };
  }

  // ===============================
  // ❌ REMOVE COLLABORATOR
  // ===============================
  static async removeCollaborator(rfpId: number, userId: number) {
    await prisma.rFPCollaborator.delete({ where: { rfpId_userId: { rfpId, userId } } });
    return { message: "Collaborator removed" };
  }
}
