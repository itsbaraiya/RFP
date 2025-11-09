"use strict";
//
// User Controller 
// 
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const UserService_1 = require("../services/UserService");
class UserController {
    static async getUsers(req, res) {
        const users = await UserService_1.UserService.getAllUsers();
        res.json(users);
    }
    static async createUser(req, res) {
        try {
            const user = await UserService_1.UserService.createUser(req.body);
            res.status(201).json(user);
        }
        catch (err) {
            console.error("Error creating user:", err.message);
            res.status(400).json({ error: "Could not create user", details: err.message });
        }
    }
    static async getUser(req, res) {
        const id = parseInt(req.params.id);
        const user = await UserService_1.UserService.getUserById(id);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        res.json(user);
    }
    // UserController.ts
    static async updateUser(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { name, email, status, isBusy, role, designation } = req.body;
            // Prepare update data
            const updateData = {
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
            const result = await UserService_1.UserService.updateUser(id, updateData);
            if (!result) {
                return res.status(404).json({ error: "User not found" });
            }
            res.json({
                user: result.user,
                token: result.token || undefined,
            });
        }
        catch (err) {
            console.error("Error updating user:", err.message, err);
            res.status(500).json({ error: "Could not update user", details: err.message });
        }
    }
    static async deleteUser(req, res) {
        const id = parseInt(req.params.id);
        const success = await UserService_1.UserService.deleteUser(id);
        if (!success)
            return res.status(404).json({ error: "User not found" });
        res.json({ message: "User deleted successfully" });
    }
}
exports.UserController = UserController;
