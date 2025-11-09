//
// User Routes
//

import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { upload } from "../middlewares/upload";

const router = Router();

router.get("/", UserController.getUsers);
router.post("/", UserController.createUser);
router.get("/:id", UserController.getUser);
router.put("/:id", upload.single("avatar"), UserController.updateUser);

router.delete("/:id", UserController.deleteUser);

export default router;
