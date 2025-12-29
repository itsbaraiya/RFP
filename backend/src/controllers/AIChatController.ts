//
// AI Chat Controller
//

import { Request, Response } from "express";
import { AIChatService } from "../services/AIChatService";

export class AIChatController {
  static async chat(req: Request, res: Response) {
    try {
      const { messages, proposalContext } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: "Messages array is required and must not be empty",
        });
      }

      for (const msg of messages) {
        if (!msg.role || !msg.content) {
          return res.status(400).json({
            error: "Each message must have 'role' and 'content' fields",
          });
        }
        if (!["user", "assistant", "system"].includes(msg.role)) {
          return res.status(400).json({
            error: "Message role must be 'user', 'assistant', or 'system'",
          });
        }
      }

      const response = await AIChatService.chat(messages, proposalContext);

      res.status(200).json({
        message: response,
      });
    } catch (err: any) {
      res.status(500).json({
        error: err.message || "Failed to process chat message",
      });
    }
  }
}

