//
//  Auth Service
//

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import EmailService from "./EmailService";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_HOURS = 1;

export class AuthService {
  static async register(data: { name: string; email: string; password: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("Email already exists");

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: Role.CUSTOMER,
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

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

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );
    
    const baseUrl = process.env.BASE_URL || "http://localhost:5001";
    let avatarUrl = null;
    if (user.avatar) {
      if (user.avatar.startsWith("http")) {    
        avatarUrl = user.avatar;
      } else if (user.avatar.startsWith("/uploads")) {    
        avatarUrl = `${baseUrl}${user.avatar}`;
      } else {    
        avatarUrl = `${baseUrl}${user.avatar}`;
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
        designation: user.designation || "",
      },
    };
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return { message: "If that email exists, a password reset link has been sent." };
    }

    const token = crypto.randomBytes(32).toString("hex");
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await EmailService.sendPasswordResetEmail(user.email, resetLink, user.name);
    } catch (error: any) {
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, token },
      });
      throw new Error(error.message || "Failed to send reset email. Please check your email configuration.");
    }

    return { message: "If that email exists, a password reset link has been sent." };
  }

  static async resetPassword(token: string, newPassword: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new Error("Invalid or expired reset token");
    }

    if (new Date() > resetToken.expiresAt) {      
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      throw new Error("Reset token has expired. Please request a new one.");
    }

    if (resetToken.used) {
      throw new Error("This reset token has already been used. Please request a new one.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        id: { not: resetToken.id },
      },
    });

    return { message: "Password has been reset successfully" };
  }
}
