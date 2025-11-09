"use strict";
//
//  User Service
//
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
class UserService {
    static async getAllUsers() {
        return prisma.user.findMany();
    }
    static async createUser(data) {
        const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
        return prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                password: hashedPassword,
                role: client_1.Role.CUSTOMER,
            },
        });
    }
    static async findByEmail(email) {
        return prisma.user.findUnique({ where: { email } });
    }
    static async getUserById(id) {
        return prisma.user.findUnique({ where: { id } });
    }
    static async updateUser(id, data) {
        try {
            const updatedUser = await prisma.user.update({
                where: { id },
                data: {
                    name: data.name,
                    email: data.email,
                    avatar: data.avatar,
                    status: data.status,
                    designation: data.designation,
                    isBusy: data.isBusy,
                    role: data.role,
                },
            });
            let token;
            if (data.role || data.email) {
                token = jsonwebtoken_1.default.sign({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
            }
            return { user: updatedUser, token };
        }
        catch (err) {
            console.error("Error updating user:", err);
            return null;
        }
    }
    static async deleteUser(id) {
        try {
            await prisma.user.delete({ where: { id } });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.UserService = UserService;
