"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RFPService = void 0;
const client_1 = require("@prisma/client");
const pdf2json_1 = __importDefault(require("pdf2json"));
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const pdf_lib_1 = require("pdf-lib");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY});
const sanitizeFileName = (title) => title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
class RFPService {
    static async upload(req, userId) {
        if (!req.file)
            throw new Error("No file uploaded");
        const uploadsFolder = path_1.default.join(__dirname, "..", "..", "uploads", "rfps", "generated");
        await promises_1.default.mkdir(uploadsFolder, { recursive: true });
        const fileName = `${sanitizeFileName(req.file.originalname)}-${Date.now()}${path_1.default.extname(req.file.originalname)}`;
        const filePath = path_1.default.join(uploadsFolder, fileName);
        await promises_1.default.rename(req.file.path, filePath);
        const relativePath = path_1.default.relative(path_1.default.join(__dirname, "..", ".."), filePath).replace(/\\/g, "/");
        const rfp = await prisma.rFP.create({
            data: { title: req.file.originalname, filePath: relativePath, userId, status: "PENDING" }
        });
        return { id: rfp.id, title: rfp.title, filePath: rfp.filePath, status: rfp.status };
    }
    static async deleteRFP(rfpId, userId) {
        const rfp = await prisma.rFP.findUnique({ where: { id: rfpId } });
        if (!rfp)
            throw new Error("RFP not found");
        if (rfp.userId !== userId)
            throw new Error("Unauthorized to delete this RFP");
        await prisma.rFPCollaborator.deleteMany({ where: { rfpId } });
        await prisma.question.deleteMany({ where: { rfpId } });
        const filePath = path_1.default.join(__dirname, "..", "..", rfp.filePath);
        try {
            await promises_1.default.unlink(filePath);
        }
        catch { }
        await prisma.rFP.delete({ where: { id: rfpId } });
        return { message: "RFP deleted successfully" };
    }
    static async getAll(userId) {
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
    static async analyze(rfpId) {
        // ---------------- Validate RFP ----------------
        const rfp = await prisma.rFP.findUnique({ where: { id: rfpId } });
        if (!rfp)
            throw new Error("RFP not found");
        const fullPath = path_1.default.join(__dirname, "..", "..", rfp.filePath);
        // ---------------- Extract PDF Text ----------------
        const pdfText = await new Promise((resolve, reject) => {
            const pdfParser = new pdf2json_1.default();
            pdfParser.on("pdfParser_dataError", (errData) => reject(errData?.parserError || errData));
            pdfParser.on("pdfParser_dataReady", (pdfData) => {
                try {
                    const text = pdfData.Pages.map((page) => page.Texts.map((t) => decodeURIComponent(t.R[0].T)).join(" ")).join("\n");
                    resolve(text);
                }
                catch (err) {
                    reject(err);
                }
            });
            pdfParser.loadPDF(fullPath);
        });
        // ---------------- Chunk Large PDF ----------------
        const MAX_CHUNK = 12000;
        const chunks = [];
        for (let i = 0; i < pdfText.length; i += MAX_CHUNK) {
            chunks.push(pdfText.slice(i, i + MAX_CHUNK));
        }
        // ---------------- Instruction for AI ----------------
        const instruct = (chunk) => `
You are an AI assistant that analyzes RFP documents.

Return ONLY valid JSON:

{
  "summary": "1 short paragraph summary",
  "key_requirements": ["..."],
  "sections": ["..."],
  "questions": [
      {
        "question": "Write a clear clarifying question",
        "suggestedAnswer": "Short 1-2 line AI answer",
        "section": "Optional section name"
      }
  ],
  "risks": ["..."],
  "missing_items": ["..."]
}

RFP TEXT:
${chunk}
`;
        // ---------------- Prepare Aggregated Structure ----------------
        let aggregated = {
            summary: "",
            key_requirements: [],
            sections: [],
            questions: [],
            risks: [],
            missing_items: [],
        };
        // ---------------- Process Chunk by Chunk ----------------
        for (const chunk of chunks) {
            const aiResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: instruct(chunk) }],
                temperature: 0,
            });
            let content = aiResponse.choices?.[0]?.message?.content || "{}";
            // ---------------- Robust JSON Parse ----------------
            let parsed;
            try {
                parsed = JSON.parse(content);
            }
            catch {
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
        }
        // ---------------- Remove Duplicate Text ----------------
        const unique = (arr) => Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));
        const finalQuestions = aggregated.questions
            .map((q) => ({
            question: (q.question || "").trim(),
            suggestedAnswer: (q.suggestedAnswer || "").trim(),
            section: q.section?.trim() || null,
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
        return {
            message: "RFP analyzed successfully",
            summary: aggregated.summary.trim(),
            key_requirements: unique(aggregated.key_requirements),
            sections: unique(aggregated.sections),
            questions: finalQuestions,
            risks: unique(aggregated.risks),
            missing_items: unique(aggregated.missing_items),
        };
    }
    static async getQuestions(rfpId) {
        const rfp = await prisma.rFP.findUnique({
            where: { id: rfpId },
            include: {
                questions: {
                    select: {
                        id: true,
                        questionText: true,
                        aiSuggestedAnswer: true,
                        userEditedAnswer: true,
                        section: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
        if (!rfp)
            throw new Error("RFP not found");
        // Map DB Question rows to API-friendly shape
        const questions = (rfp.questions || []).map((q) => ({
            id: q.id,
            questionText: q.questionText,
            aiSuggestedAnswer: q.aiSuggestedAnswer || "",
            userEditedAnswer: q.userEditedAnswer || "",
            section: q.section || null,
            createdAt: q.createdAt,
            updatedAt: q.updatedAt,
        }));
        // Return standardized object: { summary, questions }
        return {
            summary: rfp.description || "",
            questions,
        };
    }
    static async generateAI(title, description, category, prompt, userId) {
        if (!prompt)
            throw new Error("Prompt is required");
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
        if (!rfpText)
            throw new Error("AI failed to generate RFP");
        const uploadsFolder = path_1.default.join(__dirname, "..", "..", "uploads", "rfps", "generated");
        await promises_1.default.mkdir(uploadsFolder, { recursive: true });
        const fileName = `${sanitizeFileName(title)}-${Date.now()}.pdf`;
        const filePath = path_1.default.join(uploadsFolder, fileName);
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const fontSize = 12;
        const lines = rfpText.split("\n");
        let y = height - 50;
        for (const line of lines) {
            if (y < 50) {
                page = pdfDoc.addPage();
                y = height - 50;
            }
            page.drawText(line, { x: 50, y, size: fontSize, font, color: (0, pdf_lib_1.rgb)(0, 0, 0) });
            y -= fontSize + 5;
        }
        const pdfBytes = await pdfDoc.save();
        await promises_1.default.writeFile(filePath, pdfBytes);
        const relativePath = path_1.default.relative(path_1.default.join(__dirname, "..", ".."), filePath).replace(/\\/g, "/");
        const rfp = await prisma.rFP.create({
            data: { title, description, category, filePath: relativePath, userId, status: "ANALYZED" },
        });
        return { id: rfp.id, title: rfp.title, filePath: rfp.filePath, status: rfp.status };
    }
    static async getCollaborators(rfpId) {
        const collaborators = await prisma.rFPCollaborator.findMany({
            where: { rfpId },
            include: { user: { select: { id: true, name: true, email: true, role: true } } },
        });
        return collaborators.map((c) => ({
            id: c.user.id, name: c.user.name, email: c.user.email, role: c.role,
        }));
    }
    static async addCollaborator(rfpId, email, requesterId) {
        const collaboratorUser = await prisma.user.findUnique({ where: { email } });
        if (!collaboratorUser)
            throw new Error("User not found");
        if (collaboratorUser.id === requesterId)
            throw new Error("You cannot add yourself");
        const exists = await prisma.rFPCollaborator.findUnique({
            where: { rfpId_userId: { rfpId, userId: collaboratorUser.id } },
        });
        if (exists)
            throw new Error("Already a collaborator");
        const created = await prisma.rFPCollaborator.create({
            data: { rfpId, userId: collaboratorUser.id, role: "Collaborator" },
            include: { user: true },
        });
        return { message: "Collaborator added", collaborator: { id: created.user.id, name: created.user.name, email: created.user.email, role: created.role } };
    }
    static async removeCollaborator(rfpId, userId) {
        await prisma.rFPCollaborator.delete({ where: { rfpId_userId: { rfpId, userId } } });
        return { message: "Collaborator removed" };
    }
}
exports.RFPService = RFPService;
