"use strict";
//
// Dashboard Controller 
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const prisma_1 = require("../generated/prisma");
class DashboardController {
    static getDashboard(req, res) {
        const user = req.user;
        switch (user.role) {
            case prisma_1.Role.ADMIN:
                return res.json({ message: "Welcome Admin", data: { /* admin info */} });
            case prisma_1.Role.CUSTOMER:
                return res.json({ message: "Welcome Customer", data: { /* customer info */} });
            case prisma_1.Role.COLLABORATOR:
                return res.json({ message: "Welcome Collaborator", data: { /* collaborator info */} });
            default:
                return res.status(403).json({ error: "Role not recognized" });
        }
    }
}
exports.DashboardController = DashboardController;
