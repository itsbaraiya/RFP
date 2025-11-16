"use strict";
//
// RFP SERVICE — FULLY FIXED AND CLEANED
//
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
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY || "dummy-key" });
const sanitizeFileName = (title) => title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
class RFPService {
    // ===============================
    // 📤 UPLOAD RFP
    // ===============================
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
    static async deleteRFP(rfpId, userId) {
        const rfp = await prisma.rFP.findUnique({ where: { id: rfpId } });
        if (!rfp)
            throw new Error("RFP not found");
        if (rfp.userId !== userId)
            throw new Error("Unauthorized to delete this RFP");
        // Delete collaborators & questions
        await prisma.rFPCollaborator.deleteMany({ where: { rfpId } });
        await prisma.question.deleteMany({ where: { rfpId } });
        // Delete physical file
        const filePath = path_1.default.join(__dirname, "..", "..", rfp.filePath);
        try {
            await promises_1.default.unlink(filePath);
        }
        catch { }
        await prisma.rFP.delete({ where: { id: rfpId } });
        return { message: "RFP deleted successfully" };
    }
    // ===============================
    // 📄 GET ALL RFPs
    // ===============================
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
    static async analyze(rfpId) {
        const rfp = await prisma.rFP.findUnique({ where: { id: rfpId } });
        if (!rfp)
            throw new Error("RFP not found");
        const fullPath = path_1.default.join(__dirname, "..", "..", rfp.filePath);
        // Extract PDF text
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
        }
        catch {
            parsed = { summary: content, key_requirements: [], sections: [], questions: [] };
        }
        const { summary = "", key_requirements = [], sections = [], questions = [] } = parsed;
        // Save questions with AI answer
        if (Array.isArray(questions) && questions.length > 0) {
            await prisma.question.createMany({
                data: questions.map((q) => ({
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
    static async getQuestions(rfpId) {
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
    static async generateAI(title, description, category, prompt, userId) {
        if (!prompt)
            throw new Error("Prompt is required");
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
        if (!rfpText)
            throw new Error("AI failed to generate RFP");
        const uploadsFolder = path_1.default.join(__dirname, "..", "..", "uploads", "rfps", "generated");
        await promises_1.default.mkdir(uploadsFolder, { recursive: true });
        const fileName = `${sanitizeFileName(title)}-${Date.now()}.txt`;
        const filePath = path_1.default.join(uploadsFolder, fileName);
        await promises_1.default.writeFile(filePath, rfpText);
        const relativePath = path_1.default.relative(path_1.default.join(__dirname, "..", ".."), filePath).replace(/\\/g, "/");
        const rfp = await prisma.rFP.create({
            data: { title, description, category, filePath: relativePath, userId, status: "ANALYZED" },
        });
        return { id: rfp.id, title: rfp.title, filePath: rfp.filePath, status: rfp.status };
    }
    // ===============================
    // 👥 GET COLLABORATORS
    // ===============================
    static async getCollaborators(rfpId) {
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
        return {
            message: "Collaborator added",
            collaborator: { id: created.user.id, name: created.user.name, email: created.user.email, role: created.role },
        };
    }
    // ===============================
    // ❌ REMOVE COLLABORATOR
    // ===============================
    static async removeCollaborator(rfpId, userId) {
        await prisma.rFPCollaborator.delete({ where: { rfpId_userId: { rfpId, userId } } });
        return { message: "Collaborator removed" };
    }
}
exports.RFPService = RFPService;
