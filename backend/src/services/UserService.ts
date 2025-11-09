//
//  User Service
//

import { PrismaClient, User, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export class UserService {
  static async getAllUsers(): Promise<User[]> {
    return prisma.user.findMany();
  }

  static async createUser(data: { email: string; password: string; name: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: Role.CUSTOMER,
      },
    });
  }

  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  static async getUserById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  static async updateUser(
    id: number,
    data: Partial<{
      name: string;
      email: string;
      avatar: string | null;
      status: string;
      isBusy: boolean;
      role: Role;
      designation?: string;
    }>
  ): Promise<{ user: User; token?: string } | null> {
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
        token = jwt.sign(
          { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
          process.env.JWT_SECRET!,
          { expiresIn: "1d" }
        );
      }

      return { user: updatedUser, token };
    } catch (err) {
      console.error("Error updating user:", err);
      return null;
    }
  }

  static async deleteUser(id: number): Promise<boolean> {
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
