"use strict";
//
//  Auth Service
//
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = require("../generated/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new prisma_1.PrismaClient();
const SALT_ROUNDS = 10;
class AuthService {
    static async register(data) {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing)
            throw new Error("Email already exists");
        const hashedPassword = await bcrypt_1.default.hash(data.password, SALT_ROUNDS);
        const newUser = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: prisma_1.Role.CUSTOMER,
            },
        });
        const token = jsonwebtoken_1.default.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        return {
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
            token,
        };
    }
    static async login(email, password) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new Error("Invalid credentials");
        const valid = await bcrypt_1.default.compare(password, user.password);
        if (!valid)
            throw new Error("Invalid credentials");
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const baseUrl = process.env.BASE_URL || "http://localhost:5001";
        let avatarUrl = null;
        if (user.avatar) {
            if (user.avatar.startsWith("http")) {
                avatarUrl = user.avatar;
            }
            else if (user.avatar.startsWith("/uploads")) {
                avatarUrl = `${baseUrl}${user.avatar}`;
            }
            else {
                avatarUrl = `${baseUrl}/uploads/${user.avatar}`;
            }
        }
        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                isBusy: user.isBusy,
                avatar: avatarUrl,
            },
        };
    }
}
exports.AuthService = AuthService;
