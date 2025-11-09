"use strict";
//
// Auth Middleware
//
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Unauthorized User" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded.id && !decoded.userId) {
            return res.status(401).json({ error: "Invalid token payload" });
        }
        req.user = {
            id: decoded.id || decoded.userId,
            email: decoded.email
        };
        next();
    }
    catch (error) {
        console.error("JWT verification error:", error);
        res.status(401).json({ error: "Invalid token" });
    }
};
exports.authMiddleware = authMiddleware;
