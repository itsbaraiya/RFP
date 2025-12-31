//
// Question Controller
// Enhanced question management endpoints
// All endpoints are NEW - existing functionality remains untouched
//

import { Request, Response } from "express";
import { QuestionService } from "../services/QuestionService";
import { AnswerGenerationService } from "../services/AnswerGenerationService";

export class QuestionController {
  /**
   * Get single question with full details
   * NEW endpoint: GET /rfps/:id/questions/:questionId
   */
  static async getQuestion(req: Request, res: Response) {
    try {
      const questionId = Number(req.params.questionId);
      const userId = Number((req.user as any)?.id);

      if (!questionId || isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const question = await QuestionService.getQuestionById(questionId, userId);
      return res.status(200).json(question);
    } catch (err: any) {
      console.error("Error in getQuestion:", err);
      return res.status(500).json({
        error: err.message || "Failed to fetch question",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }

  /**
   * Get questions with filters
   * Enhanced version of existing endpoint (backward compatible)
   * GET /rfps/:id/questions?status=DRAFT&section=Requirements
   */
  static async getQuestionsEnhanced(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      const userId = Number((req.user as any)?.id);

      if (!rfpId || isNaN(rfpId)) {
        return res.status(400).json({ error: "Invalid RFP ID" });
      }
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const filters: any = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.complianceStatus) filters.complianceStatus = req.query.complianceStatus;
      if (req.query.section) filters.section = req.query.section;
      if (req.query.assignedToMe === "true") filters.assignedToMe = true;

      const questions = await QuestionService.getQuestions(rfpId, userId, filters);
      return res.status(200).json(questions);
    } catch (err: any) {
      console.error("Error in getQuestionsEnhanced:", err);
      return res.status(500).json({
        error: err.message || "Failed to fetch questions",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }

  /**
   * Update question answer
   * NEW endpoint: PUT /rfps/:id/questions/:questionId
   */
  static async updateQuestion(req: Request, res: Response) {
    try {
      const questionId = Number(req.params.questionId);
      const userId = Number((req.user as any)?.id);
      const { answer, userEditedAnswer, finalAnswer, status } = req.body;

      if (!questionId || isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const updated = await QuestionService.updateQuestionAnswer(questionId, userId, {
        answer, // Backward compatible
        userEditedAnswer,
        finalAnswer,
        status,
      });

      return res.status(200).json(updated);
    } catch (err: any) {
      console.error("Error in updateQuestion:", err);
      return res.status(500).json({
        error: err.message || "Failed to update question",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }

  /**
   * Submit answer for review
   * NEW endpoint: POST /rfps/:id/questions/:questionId/submit
   */
  static async submitAnswer(req: Request, res: Response) {
    try {
      const questionId = Number(req.params.questionId);
      const userId = Number((req.user as any)?.id);

      if (!questionId || isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const updated = await QuestionService.submitAnswer(questionId, userId);
      return res.status(200).json({
        message: "Answer submitted for review",
        question: updated,
      });
    } catch (err: any) {
      console.error("Error in submitAnswer:", err);
      return res.status(500).json({
        error: err.message || "Failed to submit answer",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }

  /**
   * Approve answer
   * NEW endpoint: POST /rfps/:id/questions/:questionId/approve
   */
  static async approveAnswer(req: Request, res: Response) {
    try {
      const questionId = Number(req.params.questionId);
      const userId = Number((req.user as any)?.id);

      if (!questionId || isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const updated = await QuestionService.approveAnswer(questionId, userId);
      return res.status(200).json({
        message: "Answer approved",
        question: updated,
      });
    } catch (err: any) {
      console.error("Error in approveAnswer:", err);
      return res.status(500).json({
        error: err.message || "Failed to approve answer",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }

  /**
   * Reject answer
   * NEW endpoint: POST /rfps/:id/questions/:questionId/reject
   */
  static async rejectAnswer(req: Request, res: Response) {
    try {
      const questionId = Number(req.params.questionId);
      const userId = Number((req.user as any)?.id);
      const { reason } = req.body;

      if (!questionId || isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: "Rejection reason is required" });
      }

      const updated = await QuestionService.rejectAnswer(questionId, userId, reason);
      return res.status(200).json({
        message: "Answer rejected",
        question: updated,
      });
    } catch (err: any) {
      console.error("Error in rejectAnswer:", err);
      return res.status(500).json({
        error: err.message || "Failed to reject answer",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }

  /**
   * Assign editor/reviewer
   * NEW endpoint: PUT /rfps/:id/questions/:questionId/assign
   */
  static async assignQuestion(req: Request, res: Response) {
    try {
      const questionId = Number(req.params.questionId);
      const userId = Number((req.user as any)?.id);
      const { editorId, reviewerId } = req.body;

      if (!questionId || isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const updated = await QuestionService.assignQuestion(questionId, userId, {
        editorId: editorId !== undefined ? (editorId === null ? null : Number(editorId)) : undefined,
        reviewerId: reviewerId !== undefined ? (reviewerId === null ? null : Number(reviewerId)) : undefined,
      });

      return res.status(200).json({
        message: "Question assigned successfully",
        question: updated,
      });
    } catch (err: any) {
      console.error("Error in assignQuestion:", err);
      return res.status(500).json({
        error: err.message || "Failed to assign question",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }

  /**
   * Update compliance status
   * NEW endpoint: PUT /rfps/:id/questions/:questionId/compliance
   */
  static async updateCompliance(req: Request, res: Response) {
    try {
      const questionId = Number(req.params.questionId);
      const userId = Number((req.user as any)?.id);
      const { complianceStatus } = req.body;

      if (!questionId || isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!complianceStatus) {
        return res.status(400).json({ error: "Compliance status is required" });
      }

      const validStatuses = ["COMPLIANT", "NON_COMPLIANT", "PARTIAL", "NOT_APPLICABLE"];
      if (!validStatuses.includes(complianceStatus)) {
        return res.status(400).json({ error: "Invalid compliance status" });
      }

      const updated = await QuestionService.updateCompliance(
        questionId,
        userId,
        complianceStatus as any
      );

      return res.status(200).json({
        message: "Compliance status updated",
        question: updated,
      });
    } catch (err: any) {
      console.error("Error in updateCompliance:", err);
      return res.status(500).json({
        error: err.message || "Failed to update compliance",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }

  /**
   * Get answer version history
   * NEW endpoint: GET /rfps/:id/questions/:questionId/history
   */
  static async getAnswerHistory(req: Request, res: Response) {
    try {
      const questionId = Number(req.params.questionId);
      const userId = Number((req.user as any)?.id);

      if (!questionId || isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const history = await QuestionService.getAnswerHistory(questionId, userId);
      return res.status(200).json(history);
    } catch (err: any) {
      console.error("Error in getAnswerHistory:", err);
      return res.status(500).json({
        error: err.message || "Failed to fetch answer history",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }

  /**
   * Generate answer for single question
   * NEW endpoint: POST /rfps/:id/questions/:questionId/generate
   */
  static async generateAnswer(req: Request, res: Response) {
    try {
      const questionId = Number(req.params.questionId);
      const userId = Number((req.user as any)?.id);
      const { usePreviousResponses, useContentLibrary } = req.body;

      if (!questionId || isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await AnswerGenerationService.generateAnswer(questionId, userId, {
        usePreviousResponses: usePreviousResponses !== false,
        useContentLibrary: useContentLibrary !== false,
      });

      return res.status(200).json({
        message: "Answer generated successfully",
        ...result,
      });
    } catch (err: any) {
      console.error("Error in generateAnswer:", err);
      return res.status(500).json({
        error: err.message || "Failed to generate answer",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }

  /**
   * Generate answers for multiple questions (bulk)
   * NEW endpoint: POST /rfps/:id/questions/generate-answers
   */
  static async generateAnswersBulk(req: Request, res: Response) {
    try {
      const rfpId = Number(req.params.id);
      const userId = Number((req.user as any)?.id);
      const { questionIds, usePreviousResponses, useContentLibrary } = req.body;

      if (!rfpId || isNaN(rfpId)) {
        return res.status(400).json({ error: "Invalid RFP ID" });
      }
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await AnswerGenerationService.generateAnswersBulk(
        rfpId,
        userId,
        questionIds,
        {
          usePreviousResponses: usePreviousResponses !== false,
          useContentLibrary: useContentLibrary !== false,
        }
      );

      return res.status(200).json({
        message: "Bulk answer generation completed",
        ...result,
      });
    } catch (err: any) {
      console.error("Error in generateAnswersBulk:", err);
      return res.status(500).json({
        error: err.message || "Failed to generate answers",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }
}

