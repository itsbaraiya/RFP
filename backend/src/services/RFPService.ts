//
//  RFP Service
//

import { PrismaClient } from "../generated/prisma";
import fs from "fs";
import path from "path";
import PDFParser from "pdf2json";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();


const prisma = new PrismaClient();
const uploadDir = path.join(__dirname, "../../uploads/rfps");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class RFPService {
  // ==============================
  // UPLOAD RFP
  // ==============================
  static async upload(req: any, userId: string) {
    if (!req.file) throw new Error("No file uploaded");

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
  static async getAll(userId: string) {
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
  static async analyze(rfpId: string) {
    const rfp = await prisma.rFP.findUnique({
      where: { id: Number(rfpId) },
    });

    if (!rfp) throw new Error("RFP not found");

    const fullPath = path.join(__dirname, "../../", rfp.filePath);

    const pdfText = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataError", (errData) =>
        reject(errData.parserError)
      );
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        const text = pdfData.Pages.map((page: any) =>
          page.Texts.map((t: any) => decodeURIComponent(t.R[0].T)).join(" ")
        ).join("\n");
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

    let parsed: any;
    try {
      parsed = JSON.parse(aiContent);
    } catch {
      parsed = {
        summary: aiContent,
        key_requirements: [],
        sections: [],
        questions: [],
      };
    }

    const { summary, key_requirements, sections, questions } = parsed;
    
    if (questions && questions.length > 0) {
      await prisma.question.createMany({
        data: questions.map((q: string) => ({
          questionText: q,
          rfpId: Number(rfpId),
        })),
      });
    }

    await prisma.rFP.update({
      where: { id: Number(rfpId) },
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

  static async getCollaborators(rfpId: number) {
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
  
  static async addCollaborator(rfpId: number, email: string, requesterId: number) {    
    const collaboratorUser = await prisma.user.findUnique({ where: { email } });
    if (!collaboratorUser) throw new Error("User not found");    
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

    if (existing) throw new Error("Collaborator already added");

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

  static async removeCollaborator(rfpId: number, userId: number) {
    await prisma.rFPCollaborator.delete({
      where: {
        rfpId_userId: { rfpId, userId },
      },
    });

    return { message: "Collaborator removed successfully" };
  }
}
