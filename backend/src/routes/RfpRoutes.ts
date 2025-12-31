//
// RFP Routes
//

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { RFPController } from "../controllers/RFPController";
import { AIChatController } from "../controllers/AIChatController";
import { QuestionController } from "../controllers/QuestionController";
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
router.post("/generate", authMiddleware, RFPController.generateAI);
router.post("/create-draft", authMiddleware, RFPController.createDraft);
router.post("/ai-chat", authMiddleware, AIChatController.chat);
// Get all RFPs with collaborators (must be before dynamic routes)
router.get("/with-collaborators", authMiddleware, RFPController.getAllRFPsWithCollaborators);
// Get pending invites for current user
router.get("/pending-invites", authMiddleware, RFPController.getPendingInvites);
// Dynamic routes - order matters!
router.post("/:id/analyze", authMiddleware, RFPController.analyze);
router.get("/:id/questions", authMiddleware, RFPController.getQuestions); // Existing endpoint (backward compatible)

// Enhanced question management routes (NEW - doesn't affect existing functionality)
// These routes must come before /:id/questions/:questionId to avoid conflicts
router.post("/:id/questions/generate-answers", authMiddleware, QuestionController.generateAnswersBulk);
router.get("/:id/questions/:questionId", authMiddleware, QuestionController.getQuestion);
router.put("/:id/questions/:questionId", authMiddleware, QuestionController.updateQuestion);
router.post("/:id/questions/:questionId/submit", authMiddleware, QuestionController.submitAnswer);
router.post("/:id/questions/:questionId/approve", authMiddleware, QuestionController.approveAnswer);
router.post("/:id/questions/:questionId/reject", authMiddleware, QuestionController.rejectAnswer);
router.put("/:id/questions/:questionId/assign", authMiddleware, QuestionController.assignQuestion);
router.put("/:id/questions/:questionId/compliance", authMiddleware, QuestionController.updateCompliance);
router.get("/:id/questions/:questionId/history", authMiddleware, QuestionController.getAnswerHistory);
router.post("/:id/questions/:questionId/generate", authMiddleware, QuestionController.generateAnswer);

router.get("/:id/collaborators", authMiddleware, RFPController.getCollaborators);
router.post("/:id/collaborators", authMiddleware, RFPController.addCollaborator);
router.post("/:id/collaborators/accept", authMiddleware, RFPController.acceptInvite);
router.post("/:id/collaborators/reject", authMiddleware, RFPController.rejectInvite);
router.get("/:id/comments", authMiddleware, RFPController.getComments);
router.post("/:id/comments", authMiddleware, RFPController.addComment);
router.get("/:id/activities", authMiddleware, RFPController.getActivities);
router.put("/:id", authMiddleware, RFPController.updateRFP);
router.delete("/:id", authMiddleware, RFPController.deleteRFP);


// router.delete("/:id/collaborators/:userId", authMiddleware, RFPController.removeCollaborator);

export default router;
