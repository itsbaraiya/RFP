"use strict";
//
// Role Middleware
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleMiddleware = void 0;
const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ error: "Forbidden: insufficient permissions" });
        }
        next();
    };
};
exports.roleMiddleware = roleMiddleware;
