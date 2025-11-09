"use strict";
//
// Auth Controller 
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
const AuthService_1 = require("../services/AuthService");
class AuthController {
    static async register(req, res) {
        try {
            const result = await AuthService_1.AuthService.register(req.body);
            res.status(201).json(result);
        }
        catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
    static async login(req, res) {
        try {
            const result = await AuthService_1.AuthService.login(req.body.email, req.body.password);
            res.status(200).json(result);
        }
        catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
    static async user(req, res) {
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
            if (!user)
                return res.status(404).json({ message: "User not found" });
            // ✅ Also return full avatar URL here
            const baseUrl = process.env.BASE_URL || "http://localhost:5000";
            const avatarUrl = user.avatar ? `${baseUrl}/uploads/${user.avatar}` : null;
            res.json({ ...user, avatar: avatarUrl });
        }
        catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}
exports.AuthController = AuthController;
