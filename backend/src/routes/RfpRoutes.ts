//
// RFP Routes
//

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { RFPController } from "../controllers/RFPController";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();
const uploadDir = path.join(__dirname, "../../uploads/rfps");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });
router.post("/upload", authMiddleware, upload.single("rfp"), RFPController.upload);
router.get("/", authMiddleware, RFPController.getAll);
router.post("/analyze/:rfpId", authMiddleware, RFPController.analyze);
router.get("/:id/collaborators", authMiddleware, RFPController.getCollaborators);
router.post("/:id/collaborators", authMiddleware, RFPController.addCollaborator);
// router.delete("/:id/collaborators/:userId", authMiddleware, RFPController.removeCollaborator);

export default router;
