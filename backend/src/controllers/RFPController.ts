import { Request, Response } from "express";
import { RFPService } from "../services/RFPService";

export class RFPController {

  // ======================================================
  // 📤 Upload RFP
  // ======================================================
  static async upload(req: Request, res: Response) {
    try {
      const userId = Number((req.user as any)?.id);
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized: Invalid user ID" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const rfp = await RFPService.upload(req, userId);

      return res.status(201).json({
        message: "RFP uploaded successfully",
        rfp,
      });

    } catch (err: any) {
      console.error("Upload Error:", err);
      return res.status(500).json({ error: err.message || "File upload failed" });
    }
  }

  // ======================================================
  // ❌ Delete RFP
  // ======================================================
  static async deleteRFP(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      const userId = Number((req.user as any)?.id);

      if (!rfpId || isNaN(rfpId)) return res.status(400).json({ error: "Invalid RFP ID" });
      if (!userId || isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });

      const result = await RFPService.deleteRFP(rfpId, userId);
      return res.status(200).json(result);

    } catch (err: any) {
      console.error("Delete RFP Error:", err);
      return res.status(500).json({ error: err.message || "Failed to delete RFP" });
    }
  }

  // ======================================================
  // 🧠 Analyze RFP
  // ======================================================
  static async analyze(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.rfpId);
      if (!rfpId || isNaN(rfpId)) {
        return res.status(400).json({ error: "Invalid RFP ID" });
      }

      const analysis = await RFPService.analyze(rfpId);
      return res.status(200).json(analysis);

    } catch (err: any) {
      console.error("Analyze Error:", err);
      return res.status(500).json({ error: err.message || "Failed to analyze RFP" });
    }
  }

  // ======================================================
  // 📜 Get All RFPs for User
  // ======================================================
  static async getAll(req: Request, res: Response) {
    try {
      const userId = Number((req.user as any)?.id);
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized: Invalid user ID" });
      }

      const rfps = await RFPService.getAll(userId);
      return res.status(200).json(rfps);

    } catch (err: any) {
      console.error("Get All RFPs Error:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch RFPs" });
    }
  }

  // ======================================================
  // 👥 Get Collaborators
  // ======================================================
  static async getCollaborators(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      if (!rfpId || isNaN(rfpId)) return res.status(400).json({ error: "Invalid RFP ID" });

      const collaborators = await RFPService.getCollaborators(rfpId);
      return res.status(200).json(collaborators);

    } catch (err: any) {
      console.error("Get Collaborators Error:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch collaborators" });
    }
  }

  // ======================================================
  // ➕ Add Collaborator
  // ======================================================
  static async addCollaborator(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      const requesterId = Number((req.user as any)?.id);
      const { email } = req.body;

      if (!rfpId || isNaN(rfpId)) return res.status(400).json({ error: "Invalid RFP ID" });
      if (!requesterId || isNaN(requesterId)) return res.status(401).json({ error: "Unauthorized: Invalid user ID" });
      if (!email) return res.status(400).json({ error: "Email is required" });

      const result = await RFPService.addCollaborator(rfpId, email, requesterId);
      return res.status(201).json(result);

    } catch (err: any) {
      console.error("Add Collaborator Error:", err);
      return res.status(500).json({ error: err.message || "Failed to add collaborator" });
    }
  }

  // ======================================================
  // ❌ Remove Collaborator
  // ======================================================
  static async removeCollaborator(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      const userId = Number(req.params.userId);

      if (!rfpId || !userId || isNaN(rfpId) || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid IDs" });
      }

      const result = await RFPService.removeCollaborator(rfpId, userId);
      return res.status(200).json(result);

    } catch (err: any) {
      console.error("Remove Collaborator Error:", err);
      return res.status(500).json({ error: err.message || "Failed to remove collaborator" });
    }
  }

  // ======================================================
  // 🧠 Generate AI RFP
  // ======================================================
  static async generateAI(req: Request, res: Response) {
    try {
      const userId = Number((req.user as any)?.id);
      if (!userId || isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });

      const { title, description, category, prompt } = req.body;
      const rfp = await RFPService.generateAI(title, description, category, prompt, userId);

      // Auto analyze the newly created RFP so that questions are already available
      try {
        const analysis = await RFPService.analyze(rfp.id);
        return res.status(201).json({ message: "AI RFP generated and analyzed successfully", rfp, analysis });
      } catch (analysisErr: any) {
        // If analysis fails, we still return the created RFP but inform analysis failed
        console.error("Auto-analysis failed:", analysisErr);
        return res.status(201).json({ message: "AI RFP generated but analysis failed", rfp, analysisError: analysisErr.message || "Analysis failed" });
      }
    } catch (err: any) {
      console.error("Generate AI RFP Error:", err);
      return res.status(500).json({ error: err.message || "Failed to generate AI RFP" });
    }
  }


  // ======================================================
  // 🧠 Get Questions
  // ======================================================
  static async getQuestions(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      if (!rfpId || isNaN(rfpId)) {
        return res.status(400).json({ error: "Invalid RFP ID" });
      }

      const payload = await RFPService.getQuestions(rfpId);

      return res.status(200).json(payload);
    } catch (err: any) {
      console.error("Get Questions Error:", err);
      return res.status(500).json({ error: err.message || "Failed to load analysis" });
    }
  }
}
