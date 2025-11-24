//
// User Routes
//

import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { upload } from "../middlewares/upload";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/", UserController.getUsers);
router.post("/", UserController.createUser);
router.get("/:id", UserController.getUser);
router.put("/:id", upload.single("avatar"), UserController.updateUser);
router.get("/user", authMiddleware, UserController.getCurrentUser);
router.delete("/:id", UserController.deleteUser);

export default router;
