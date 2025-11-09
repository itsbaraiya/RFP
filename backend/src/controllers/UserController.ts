//
// User Controller 
// 

import { Request, Response } from "express";
import { UserService } from "../services/UserService";

export class UserController {
  static async getUsers(req: Request, res: Response) {
    const users = await UserService.getAllUsers();
    res.json(users);
  }

  static async createUser(req: Request, res: Response) {
    try {
      const user = await UserService.createUser(req.body);
      res.status(201).json(user);
    } catch (err: any) {
      console.error("Error creating user:", err.message);
      res.status(400).json({ error: "Could not create user", details: err.message });
    }
  }

  static async getUser(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const user = await UserService.getUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  }  

  // UserController.ts
  static async updateUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { name, email, status, isBusy, role, designation } = req.body;

      // Prepare update data
      const updateData: any = {
        name,
        email,
        status,
        designation,
        isBusy: isBusy === "true" || isBusy === true,
        role,
      };

      // ✅ Only include avatar if a new file is uploaded
      if (req.file) {
        updateData.avatar = `/uploads/${req.file.filename}`;
      }

      const result = await UserService.updateUser(id, updateData);

      if (!result) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        user: result.user,
        token: result.token || undefined,
      });
    } catch (err: any) {
      console.error("Error updating user:", err.message, err);
      res.status(500).json({ error: "Could not update user", details: err.message });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const success = await UserService.deleteUser(id);
    if (!success) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  }
}
