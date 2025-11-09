//
// Auth Controller 
//

import { Request, Response } from "express";
import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();
import { AuthService } from "../services/AuthService";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const result = await AuthService.login(req.body.email, req.body.password);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  static async user(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          status: true,
          isBusy: true,
          role: true,
        },
      });
      if (!user) return res.status(404).json({ message: "User not found" });

      // ✅ Also return full avatar URL here
      const baseUrl = process.env.BASE_URL || "http://localhost:5000";
      const avatarUrl = user.avatar ? `${baseUrl}/uploads/${user.avatar}` : null;

      res.json({ ...user, avatar: avatarUrl });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
}
