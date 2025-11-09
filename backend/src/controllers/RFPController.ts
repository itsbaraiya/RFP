// //
// // RFP Controller
// //

// import { Request, Response } from "express";
// import { RFPService } from "../services/RFPService";

// export class RFPController {
//   static async upload(req: Request, res: Response) {
//     try {
//       const userId = req.user.id;
//       const result = await RFPService.upload(req, userId);
//       res.status(201).json(result);
//     } catch (err: any) {
//       console.error("Upload Error:", err.response?.data || err.message);
//       res.status(err.response?.status || 400).json({
//         error:
//           err.response?.data?.error?.message ||
//           err.message ||
//           "File upload failed",
//       });
//     }
//   }

//   static async getAll(req: Request, res: Response) {
//     try {
//       const userId = req.user.id;
//       const rfps = await RFPService.getAll(userId);
//       res.json(rfps);
//     } catch (err: any) {
//       console.error("Get All RFPs Error:", err.response?.data || err.message);
//       res.status(err.response?.status || 500).json({
//         error:
//           err.response?.data?.error?.message ||
//           err.message ||
//           "Failed to fetch RFPs",
//       });
//     }
//   }

//   static async analyze(req: Request, res: Response) {
//     try {
//       const { rfpId } = req.params;
//       const analysis = await RFPService.analyze(rfpId);
//       res.json(analysis);
//     } catch (err: any) {
//       console.error("Analyze RFP Error:", err.response?.data || err.message);
//       res.status(err.response?.status || 500).json({
//         error:
//           err.response?.data?.error?.message ||
//           err.message ||
//           "Failed to analyze RFP",
//       });
//     }
//   }
// }


//
// RFP Controller
//

import { Request, Response } from "express";
import { RFPService } from "../services/RFPService";

export class RFPController {
  static async upload(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const result = await RFPService.upload(req, userId);
      res.status(201).json(result);
    } catch (err: any) {
      console.error("Upload Error:", err.response?.data || err.message);
      res.status(err.response?.status || 400).json({
        error:
          err.response?.data?.error?.message ||
          err.message ||
          "File upload failed",
      });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const rfps = await RFPService.getAll(userId);
      res.json(rfps);
    } catch (err: any) {
      console.error("Get All RFPs Error:", err.response?.data || err.message);
      res.status(err.response?.status || 500).json({
        error:
          err.response?.data?.error?.message ||
          err.message ||
          "Failed to fetch RFPs",
      });
    }
  }

  static async analyze(req: Request, res: Response) {
    try {
      const { rfpId } = req.params;
      const analysis = await RFPService.analyze(rfpId);
      res.json(analysis);
    } catch (err: any) {
      console.error("Analyze RFP Error:", err.response?.data || err.message);
      res.status(err.response?.status || 500).json({
        error:
          err.response?.data?.error?.message ||
          err.message ||
          "Failed to analyze RFP",
      });
    }
  }

  // 👥 Get Collaborators
  static async getCollaborators(req: Request, res: Response) {
    try {
      const { id } = req.params; // RFP ID
      const collaborators = await RFPService.getCollaborators(parseInt(id));
      res.json(collaborators);
    } catch (err: any) {
      console.error("Get Collaborators Error:", err.message);
      res.status(500).json({ error: "Failed to fetch collaborators" });
    }
  }

  // ➕ Add Collaborator
  static async addCollaborator(req: Request, res: Response) {
    try {
      const { id } = req.params; // RFP ID
      const { email } = req.body;
      const userId = req.user.id;

      const result = await RFPService.addCollaborator(parseInt(id), email, userId);
      res.status(201).json(result);
    } catch (err: any) {
      console.error("Add Collaborator Error:", err.message);
      res.status(400).json({ error: err.message || "Failed to add collaborator" });
    }
  }
}
