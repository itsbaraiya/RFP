//
// User Controller 
// 

import { Request, Response } from "express";
import { UserService } from "../services/UserService";

export class UserController {

  // Get user
  static async getUsers(req: Request, res: Response) {
    const users = await UserService.getAllUsers();
    res.json(users);
  }

  // Create user
  static async createUser(req: Request, res: Response) {
    try {
      const user = await UserService.createUser(req.body);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ error: "Could not create user", details: err.message });
    }
  }


  // Get user
  static async getUser(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const user = await UserService.getUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  }  

  // Get current user
  static async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const user = await UserService.getUserById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: "Could not fetch user" });
    }
  }

  // Update user
  static async updateUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { name, email, status, isBusy, role, designation } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (status !== undefined) updateData.status = status;
      if (designation !== undefined) updateData.designation = designation;
      if (isBusy !== undefined) updateData.isBusy = isBusy === "true" || isBusy === true;
      if (role !== undefined) updateData.role = role;

      if (req.file) {
        updateData.avatar = `/api/uploads/${req.file.filename}`;
      }

      const result = await UserService.updateUser(id, updateData);

      if (!result) return res.status(404).json({ error: "User not found" });

      res.json({ user: result.user, token: result.token || undefined });
    } catch (err: any) {
      res.status(500).json({ error: "Could not update user", details: err.message });
    }
  }

  // Delete User 
  static async deleteUser(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const success = await UserService.deleteUser(id);
    if (!success) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  }
}
