//
// Dashboard Middleware
//

import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/", authMiddleware, DashboardController.getDashboard);

export default router;
