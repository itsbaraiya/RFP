//
// Auth Routes
//

import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/user", authMiddleware, AuthController.user);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

export default router;
