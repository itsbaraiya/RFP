//
// RFP Controller
//

import { Request, Response } from "express";
import { RFPService } from "../services/RFPService";

export class RFPController {
  // ==============================
  // 📤 Upload RFP
  // ==============================
  static async upload(req: Request, res: Response) {
    try {
      const userId = Number((req.user as any)?.id);
      if (!userId) throw new Error("Unauthorized: User ID missing");

      const result = await RFPService.upload(req, userId);
      res.status(201).json(result);
    } catch (err: any) {
      console.error("Upload Error:", err.message || err);
      res.status(400).json({
        error: err.message || "File upload failed",
      });
    }
  }

  // ==============================
  // 📜 Get All RFPs (for user)
  // ==============================
  static async getAll(req: Request, res: Response) {
    try {
      const userId = Number((req.user as any)?.id);
      if (!userId) throw new Error("Unauthorized: User ID missing");

      const rfps = await RFPService.getAll(userId);
      res.json(rfps);
    } catch (err: any) {
      console.error("Get All RFPs Error:", err.message || err);
      res.status(500).json({
        error: err.message || "Failed to fetch RFPs",
      });
    }
  }

  // ==============================
  // 🧠 Analyze RFP
  // ==============================
  static async analyze(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.rfpId);
      if (isNaN(rfpId)) throw new Error("Invalid RFP ID");

      const analysis = await RFPService.analyze(rfpId);
      res.json(analysis);
    } catch (err: any) {
      console.error("Analyze RFP Error:", err.message || err);
      res.status(500).json({
        error: err.message || "Failed to analyze RFP",
      });
    }
  }

  // ==============================
  // 👥 Get Collaborators
  // ==============================
  static async getCollaborators(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      if (isNaN(rfpId)) throw new Error("Invalid RFP ID");

      const collaborators = await RFPService.getCollaborators(rfpId);
      res.json(collaborators);
    } catch (err: any) {
      console.error("Get Collaborators Error:", err.message || err);
      res.status(500).json({ error: err.message || "Failed to fetch collaborators" });
    }
  }

  // ==============================
  // ➕ Add Collaborator
  // ==============================
  static async addCollaborator(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      if (isNaN(rfpId)) throw new Error("Invalid RFP ID");

      const { email } = req.body;
      const requesterId = Number((req.user as any)?.id);
      if (!requesterId) throw new Error("Unauthorized: User ID missing");

      const result = await RFPService.addCollaborator(rfpId, email, requesterId);
      res.status(201).json(result);
    } catch (err: any) {
      console.error("Add Collaborator Error:", err.message || err);
      res.status(400).json({ error: err.message || "Failed to add collaborator" });
    }
  }

  // ==============================
  // ❌ Remove Collaborator (Optional)
  // ==============================
  static async removeCollaborator(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      const userId = Number(req.params.userId);

      if (isNaN(rfpId) || isNaN(userId)) throw new Error("Invalid ID");

      const result = await RFPService.removeCollaborator(rfpId, userId);
      res.json(result);
    } catch (err: any) {
      console.error("Remove Collaborator Error:", err.message || err);
      res.status(400).json({ error: err.message || "Failed to remove collaborator" });
    }
  }
}
