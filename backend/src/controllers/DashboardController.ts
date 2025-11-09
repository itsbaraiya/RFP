//
// Dashboard Controller 
//

import { Request, Response } from "express";
import { Role } from "@prisma/client";

export class DashboardController {
  static getDashboard(req: Request, res: Response) {
    const user = req.user;

    switch (user.role) {
      case Role.ADMIN:
        return res.json({ message: "Welcome Admin", data: { /* admin info */ } });
      case Role.CUSTOMER:
        return res.json({ message: "Welcome Customer", data: { /* customer info */ } });
      case Role.COLLABORATOR:
        return res.json({ message: "Welcome Collaborator", data: { /* collaborator info */ } });
      default:
        return res.status(403).json({ error: "Role not recognized" });
    }
  }
}
