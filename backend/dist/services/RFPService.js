"use strict";
//
//  RFP Service
//
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RFPService = void 0;
const prisma_1 = require("../generated/prisma");
const path_1 = __importDefault(require("path"));
const pdf2json_1 = __importDefault(require("pdf2json"));
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new prisma_1.PrismaClient();
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
class RFPService {
    // ==============================
    // UPLOAD RFP
    // ==============================
    static async upload(req, userId) {
        if (!req.file)
            throw new Error("No file uploaded");
        const filePath = `/uploads/rfps/${req.file.filename}`;
        const rfp = await prisma.rFP.create({
            data: {
                title: req.file.originalname,
                filePath,
                userId,
                status: "PENDING",
            },
        });
        return { message: "RFP uploaded successfully", rfp };
    }
    // ==============================
    // GET ALL RFPs (for logged-in user)
    // ==============================
    static async getAll(userId) {
        return prisma.rFP.findMany({
            where: { userId },
            include: {
                questions: true,
                collaborators: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    // ==============================
    // ANALYZE RFP CONTENT
    // ==============================
    static async analyze(rfpId) {
        const rfp = await prisma.rFP.findUnique({
            where: { id: rfpId },
        });
        if (!rfp)
            throw new Error("RFP not found");
        const fullPath = path_1.default.join(__dirname, "../../", rfp.filePath);
        const pdfText = await new Promise((resolve, reject) => {
            const pdfParser = new pdf2json_1.default();
            pdfParser.on("pdfParser_dataError", (errData) => {
                const parserError = errData?.parserError || errData;
                reject(parserError);
            });
            pdfParser.on("pdfParser_dataReady", (pdfData) => {
                const text = pdfData.Pages.map((page) => page.Texts.map((t) => decodeURIComponent(t.R[0].T)).join(" ")).join("\n");
                resolve(text);
            });
            pdfParser.loadPDF(fullPath);
        });
        const prompt = `
      You are an expert RFP analyst. 
      Analyze the following RFP text and extract:
      1. Summary
      2. Key Requirements
      3. Sections
      4. Potential Questions

      Return the result strictly in JSON format like this:
      {
        "summary": "...",
        "key_requirements": ["...", "..."],
        "sections": ["...", "..."],
        "questions": ["...", "..."]
      }

      RFP text:
      ${pdfText.slice(0, 12000)}
    `;
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        });
        const aiContent = response.choices[0].message?.content || "{}";
        let parsed;
        try {
            parsed = JSON.parse(aiContent);
        }
        catch {
            parsed = {
                summary: aiContent,
                key_requirements: [],
                sections: [],
                questions: [],
            };
        }
        const { summary, key_requirements, sections, questions } = parsed;
        if (Array.isArray(questions) && questions.length > 0) {
            await prisma.question.createMany({
                data: questions.map((q) => ({
                    questionText: q,
                    rfpId,
                })),
            });
        }
        await prisma.rFP.update({
            where: { id: rfpId },
            data: {
                status: "ANALYZED",
                description: summary || "",
            },
        });
        return {
            message: "RFP analyzed successfully",
            summary,
            key_requirements,
            sections,
            questions,
        };
    }
    // ==============================
    // COLLABORATOR METHODS
    // ==============================
    static async getCollaborators(rfpId) {
        const collaborators = await prisma.rFPCollaborator.findMany({
            where: { rfpId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        return collaborators.map((col) => ({
            id: col.user.id,
            name: col.user.name,
            email: col.user.email,
            role: col.role,
        }));
    }
    static async addCollaborator(rfpId, email, requesterId) {
        const collaboratorUser = await prisma.user.findUnique({ where: { email } });
        if (!collaboratorUser)
            throw new Error("User not found");
        if (collaboratorUser.id === requesterId)
            throw new Error("You cannot add yourself as a collaborator");
        const existing = await prisma.rFPCollaborator.findUnique({
            where: {
                rfpId_userId: {
                    rfpId,
                    userId: collaboratorUser.id,
                },
            },
        });
        if (existing)
            throw new Error("Collaborator already added");
        const newCollaborator = await prisma.rFPCollaborator.create({
            data: {
                rfpId,
                userId: collaboratorUser.id,
                role: "Collaborator",
            },
            include: { user: true },
        });
        return {
            message: "Collaborator added successfully",
            collaborator: {
                id: newCollaborator.user.id,
                name: newCollaborator.user.name,
                email: newCollaborator.user.email,
                role: newCollaborator.role,
            },
        };
    }
    static async removeCollaborator(rfpId, userId) {
        await prisma.rFPCollaborator.delete({
            where: {
                rfpId_userId: { rfpId, userId },
            },
        });
        return { message: "Collaborator removed successfully" };
    }
}
exports.RFPService = RFPService;
