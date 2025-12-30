import { Request, Response } from "express";
import { RFPService } from "../services/RFPService";

export class RFPController {

  // ======================================================
  // Upload RFP
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
      return res.status(500).json({ error: err.message || "File upload failed" });
    }
  }

  // ======================================================
  // Update RFP
  // ======================================================
  static async updateRFP(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      const userId = Number((req.user as any)?.id);
      const { title, description, category, status } = req.body;

      if (!rfpId || isNaN(rfpId)) return res.status(400).json({ error: "Invalid RFP ID" });
      if (!userId || isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });

      const rfp = await RFPService.updateRFP(rfpId, userId, { title, description, category, status });
      return res.status(200).json({ message: "RFP updated successfully", rfp });

    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to update RFP" });
    }
  }

  // ======================================================
  // Create Draft RFP
  // ======================================================
  static async createDraft(req: Request, res: Response) {
    try {
      const userId = Number((req.user as any)?.id);
      if (!userId || isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });

      const { title, description, category, aiPrompt } = req.body;
      if (!title) return res.status(400).json({ error: "Title is required" });

      const rfp = await RFPService.createDraft(title, description, category, userId, aiPrompt);
      return res.status(201).json({ message: "Draft saved successfully", rfp });

    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to create draft" });
    }
  }

  // ======================================================
  // Delete RFP
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
      return res.status(500).json({ error: err.message || "Failed to delete RFP" });
    }
  }

  // ======================================================
  // Analyze RFP
  // ======================================================
  static async analyze(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      if (!rfpId || isNaN(rfpId)) {
        return res.status(400).json({ error: "Invalid RFP ID" });
      }

      const analysis = await RFPService.analyze(rfpId);
      return res.status(200).json(analysis);

    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to analyze RFP" });
    }
  }

  // ======================================================
  // Get All RFPs for User
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
      return res.status(500).json({ error: err.message || "Failed to fetch RFPs" });
    }
  }

  // ======================================================
  // Get All RFPs with Collaborators
  // ======================================================
  static async getAllRFPsWithCollaborators(req: Request, res: Response) {
    try {
      const userId = Number((req.user as any)?.id);
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized: Invalid user ID" });
      }

      const rfps = await RFPService.getAllRFPsWithCollaborators(userId);
      return res.status(200).json(rfps);

    } catch (err: any) {
      console.error("Get All RFPs with Collaborators Error:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch RFPs with collaborators" });
    }
  }

  // ======================================================
  // Get Collaborators
  // ======================================================
  static async getCollaborators(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      if (!rfpId || isNaN(rfpId)) return res.status(400).json({ error: "Invalid RFP ID" });

      const collaborators = await RFPService.getCollaborators(rfpId);
      return res.status(200).json(collaborators);

    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch collaborators" });
    }
  }

  // ======================================================
  // Add Collaborator
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
      return res.status(500).json({ error: err.message || "Failed to add collaborator" });
    }
  }

  // ======================================================
  // Accept Invite
  // ======================================================
  static async acceptInvite(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      const userId = Number((req.user as any)?.id);

      if (!rfpId || isNaN(rfpId)) return res.status(400).json({ error: "Invalid RFP ID" });
      if (!userId || isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });

      const result = await RFPService.acceptInvite(rfpId, userId);
      return res.status(200).json(result);

    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to accept invitation" });
    }
  }

  // ======================================================
  // Reject Invite
  // ======================================================
  static async rejectInvite(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      const userId = Number((req.user as any)?.id);

      if (!rfpId || isNaN(rfpId)) return res.status(400).json({ error: "Invalid RFP ID" });
      if (!userId || isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });

      const result = await RFPService.rejectInvite(rfpId, userId);
      return res.status(200).json(result);

    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to reject invitation" });
    }
  }

  // ======================================================
  // Get Pending Invites
  // ======================================================
  static async getPendingInvites(req: Request, res: Response) {
    try {
      const userId = Number((req.user as any)?.id);
      if (!userId || isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });

      const invites = await RFPService.getPendingInvites(userId);
      return res.status(200).json(invites);

    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch pending invites" });
    }
  }

  // ======================================================
  // Get Comments
  // ======================================================
  static async getComments(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      const userId = Number((req.user as any)?.id);

      if (!rfpId || isNaN(rfpId)) return res.status(400).json({ error: "Invalid RFP ID" });
      if (!userId || isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });

      const comments = await RFPService.getComments(rfpId, userId);
      return res.status(200).json(comments);

    } catch (err: any) {
      console.error("Error in getComments:", err);
      return res.status(500).json({ 
        error: err.message || "Failed to fetch comments",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
      });
    }
  }

  // ======================================================
  // Add Comment
  // ======================================================
  static async addComment(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      const userId = Number((req.user as any)?.id);
      const { content } = req.body;

      if (!rfpId || isNaN(rfpId)) return res.status(400).json({ error: "Invalid RFP ID" });
      if (!userId || isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });
      if (!content || !content.trim()) return res.status(400).json({ error: "Comment content is required" });

      const comment = await RFPService.addComment(rfpId, userId, content);
      return res.status(201).json(comment);

    } catch (err: any) {
      console.error("Error in addComment:", err);
      return res.status(500).json({ 
        error: err.message || "Failed to add comment",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
      });
    }
  }

  // ======================================================
  // Get Activities
  // ======================================================
  static async getActivities(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      const userId = Number((req.user as any)?.id);

      if (!rfpId || isNaN(rfpId)) return res.status(400).json({ error: "Invalid RFP ID" });
      if (!userId || isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });

      const activities = await RFPService.getActivities(rfpId, userId);
      return res.status(200).json(activities);

    } catch (err: any) {
      console.error("Error in getActivities:", err);
      return res.status(500).json({ 
        error: err.message || "Failed to fetch activities",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
      });
    }
  }

  // ======================================================
  // Remove Collaborator
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
      return res.status(500).json({ error: err.message || "Failed to remove collaborator" });
    }
  }

  // ======================================================
  // Generate AI RFP
  // ======================================================
  static async generateAI(req: Request, res: Response) {
    try {
      const userId = Number((req.user as any)?.id);
      if (!userId || isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });

      const { title, description, category, prompt } = req.body;
      const rfp = await RFPService.generateAI(title, description, category, prompt, userId);

      try {
        const analysis = await RFPService.analyze(rfp.id);
        return res.status(201).json({ message: "AI RFP generated and analyzed successfully", rfp, analysis });
      } catch (analysisErr: any) {        
        return res.status(201).json({ message: "AI RFP generated but analysis failed", rfp, analysisError: analysisErr.message || "Analysis failed" });
      }
    } catch (err: any) {
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
      return res.status(500).json({ error: err.message || "Failed to load analysis" });
    }
  }
}
