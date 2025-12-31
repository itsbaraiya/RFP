//
// Question Service
// Enhanced question management with workflow, compliance, and assignments
// All methods are backward compatible with existing functionality
//

import { PrismaClient, QuestionStatus, ComplianceStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class QuestionService {
  /**
   * Get single question with all details (including new fields)
   * Backward compatible - returns all fields, new ones are optional
   */
  static async getQuestionById(questionId: number, userId: number) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        rfp: {
          select: {
            id: true,
            title: true,
            userId: true,
            collaborators: {
              where: {
                userId,
                status: "ACCEPTED",
              },
            },
          },
        },
        assignedEditor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        assignedReviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        answerSources: {
          orderBy: { relevanceScore: "desc" },
        },
        answerVersions: {
          orderBy: { version: "desc" },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!question) throw new Error("Question not found");

    // Check access: user must be owner or accepted collaborator
    const isOwner = question.rfp.userId === userId;
    const isCollaborator = question.rfp.collaborators.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new Error("Unauthorized: You don't have access to this question");
    }

    return question;
  }

  /**
   * Get all questions for an RFP with filters
   * Enhanced version that includes new fields while maintaining backward compatibility
   */
  static async getQuestions(
    rfpId: number,
    userId: number,
    filters?: {
      status?: QuestionStatus;
      complianceStatus?: ComplianceStatus;
      section?: string;
      assignedToMe?: boolean;
    }
  ) {
    // Verify RFP access
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        collaborators: {
          where: {
            userId,
            status: "ACCEPTED",
          },
        },
      },
    });

    if (!rfp) throw new Error("RFP not found");
    if (rfp.userId !== userId && rfp.collaborators.length === 0) {
      throw new Error("Unauthorized: You don't have access to this RFP");
    }

    // Build where clause
    const where: any = { rfpId };
    if (filters?.status) where.status = filters.status;
    if (filters?.complianceStatus) where.complianceStatus = filters.complianceStatus;
    if (filters?.section) where.section = filters.section;
    if (filters?.assignedToMe) {
      where.OR = [
        { assignedEditorId: userId },
        { assignedReviewerId: userId },
      ];
    }

    const questions = await prisma.question.findMany({
      where,
      include: {
        assignedEditor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        assignedReviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        answerSources: {
          orderBy: { relevanceScore: "desc" },
          take: 5, // Top 5 sources
        },
        _count: {
          select: {
            answerVersions: true,
          },
        },
      },
      orderBy: [
        { section: "asc" },
        { createdAt: "asc" },
      ],
    });

    return questions;
  }

  /**
   * Update question answer (backward compatible)
   * Supports both old way (userEditedAnswer) and new way (finalAnswer with workflow)
   */
  static async updateQuestionAnswer(
    questionId: number,
    userId: number,
    data: {
      answer?: string; // For backward compatibility
      userEditedAnswer?: string; // Old field
      finalAnswer?: string; // New field
      status?: QuestionStatus;
    }
  ) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        rfp: {
          select: {
            userId: true,
            collaborators: {
              where: {
                userId,
                status: "ACCEPTED",
              },
            },
          },
        },
      },
    });

    if (!question) throw new Error("Question not found");

    // Check access
    const isOwner = question.rfp.userId === userId;
    const isCollaborator = question.rfp.collaborators.length > 0;
    const isAssignedEditor = question.assignedEditorId === userId;

    if (!isOwner && !isCollaborator && !isAssignedEditor) {
      throw new Error("Unauthorized: You don't have permission to edit this question");
    }

    // Determine which answer field to update (backward compatible)
    const updateData: any = {};
    
    if (data.answer !== undefined) {
      // Backward compatible: update userEditedAnswer if answer provided
      updateData.userEditedAnswer = data.answer;
    }
    if (data.userEditedAnswer !== undefined) {
      updateData.userEditedAnswer = data.userEditedAnswer;
    }
    if (data.finalAnswer !== undefined) {
      updateData.finalAnswer = data.finalAnswer;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    // Create version history
    const currentAnswer = data.finalAnswer || data.userEditedAnswer || data.answer;
    if (currentAnswer) {
      const latestVersion = await prisma.answerVersion.findFirst({
        where: { questionId },
        orderBy: { version: "desc" },
      });

      const nextVersion = (latestVersion?.version || 0) + 1;

      await prisma.answerVersion.create({
        data: {
          questionId,
          answerText: currentAnswer,
          version: nextVersion,
          createdBy: userId,
        },
      });
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: updateData,
      include: {
        assignedEditor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        assignedReviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        answerSources: {
          orderBy: { relevanceScore: "desc" },
          take: 5,
        },
        _count: {
          select: {
            answerVersions: true,
          },
        },
      },
    });

    // Return the updated question with all fields
    return {
      ...updated,
      finalAnswer: updated.finalAnswer || updated.userEditedAnswer || null,
      userEditedAnswer: updated.userEditedAnswer || null,
    };
  }

  /**
   * Submit answer for review (new workflow feature)
   */
  static async submitAnswer(questionId: number, userId: number) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        rfp: {
          select: {
            userId: true,
            collaborators: {
              where: {
                userId,
                status: "ACCEPTED",
              },
            },
          },
        },
      },
    });

    if (!question) throw new Error("Question not found");

    // Check permissions - only editor or owner can submit
    const isOwner = question.rfp.userId === userId;
    const isAssignedEditor = question.assignedEditorId === userId;
    const isCollaborator = question.rfp.collaborators.length > 0;

    if (!isOwner && !isAssignedEditor && !isCollaborator) {
      throw new Error("Unauthorized: You don't have permission to submit this answer");
    }

    if (question.status !== QuestionStatus.DRAFT) {
      throw new Error(`Cannot submit: Question is already ${question.status}`);
    }

    // Need an answer to submit
    const answer = question.finalAnswer || question.userEditedAnswer;
    if (!answer) {
      throw new Error("Cannot submit: No answer provided");
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        status: QuestionStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        assignedReviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Approve answer (new workflow feature)
   */
  static async approveAnswer(questionId: number, userId: number) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        rfp: {
          select: {
            userId: true,
            collaborators: {
              where: {
                userId,
                status: "ACCEPTED",
              },
            },
          },
        },
      },
    });

    if (!question) throw new Error("Question not found");

    // Check permissions - only reviewer or owner can approve
    const isOwner = question.rfp.userId === userId;
    const isAssignedReviewer = question.assignedReviewerId === userId;
    const isCollaborator = question.rfp.collaborators.length > 0;

    if (!isOwner && !isAssignedReviewer && !isCollaborator) {
      throw new Error("Unauthorized: You don't have permission to approve this answer");
    }

    if (question.status !== QuestionStatus.SUBMITTED) {
      throw new Error(`Cannot approve: Question is ${question.status}, must be SUBMITTED`);
    }

    // Set finalAnswer if not already set
    const finalAnswer = question.finalAnswer || question.userEditedAnswer || question.aiSuggestedAnswer;
    if (!finalAnswer) {
      throw new Error("Cannot approve: No answer available");
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        status: QuestionStatus.APPROVED,
        approvedAt: new Date(),
        finalAnswer: finalAnswer, // Ensure finalAnswer is set
      },
    });

    return updated;
  }

  /**
   * Reject answer (new workflow feature)
   */
  static async rejectAnswer(questionId: number, userId: number, reason: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        rfp: {
          select: {
            userId: true,
            collaborators: {
              where: {
                userId,
                status: "ACCEPTED",
              },
            },
          },
        },
      },
    });

    if (!question) throw new Error("Question not found");

    // Check permissions
    const isOwner = question.rfp.userId === userId;
    const isAssignedReviewer = question.assignedReviewerId === userId;
    const isCollaborator = question.rfp.collaborators.length > 0;

    if (!isOwner && !isAssignedReviewer && !isCollaborator) {
      throw new Error("Unauthorized: You don't have permission to reject this answer");
    }

    if (question.status !== QuestionStatus.SUBMITTED) {
      throw new Error(`Cannot reject: Question is ${question.status}, must be SUBMITTED`);
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        status: QuestionStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    return updated;
  }

  /**
   * Assign editor/reviewer to question
   */
  static async assignQuestion(
    questionId: number,
    userId: number,
    data: {
      editorId?: number | null;
      reviewerId?: number | null;
    }
  ) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        rfp: {
          select: {
            userId: true,
            collaborators: {
              where: {
                status: "ACCEPTED",
              },
            },
          },
        },
      },
    });

    if (!question) throw new Error("Question not found");

    // Only RFP owner can assign
    if (question.rfp.userId !== userId) {
      throw new Error("Unauthorized: Only RFP owner can assign questions");
    }

    // Verify assigned users are collaborators
    if (data.editorId) {
      const isCollaborator = question.rfp.collaborators.some(c => c.userId === data.editorId);
      if (!isCollaborator && data.editorId !== question.rfp.userId) {
        throw new Error("Assigned editor must be a collaborator");
      }
    }

    if (data.reviewerId) {
      const isCollaborator = question.rfp.collaborators.some(c => c.userId === data.reviewerId);
      if (!isCollaborator && data.reviewerId !== question.rfp.userId) {
        throw new Error("Assigned reviewer must be a collaborator");
      }
    }

    const updateData: any = {};
    if (data.editorId !== undefined) updateData.assignedEditorId = data.editorId;
    if (data.reviewerId !== undefined) updateData.assignedReviewerId = data.reviewerId;

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: updateData,
      include: {
        assignedEditor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        assignedReviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Update compliance status
   */
  static async updateCompliance(
    questionId: number,
    userId: number,
    complianceStatus: ComplianceStatus
  ) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        rfp: {
          select: {
            userId: true,
            collaborators: {
              where: {
                userId,
                status: "ACCEPTED",
              },
            },
          },
        },
      },
    });

    if (!question) throw new Error("Question not found");

    // Check access
    const isOwner = question.rfp.userId === userId;
    const isCollaborator = question.rfp.collaborators.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new Error("Unauthorized: You don't have permission to update compliance");
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: { complianceStatus },
    });

    return updated;
  }

  /**
   * Get answer version history
   */
  static async getAnswerHistory(questionId: number, userId: number) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        rfp: {
          select: {
            userId: true,
            collaborators: {
              where: {
                userId,
                status: "ACCEPTED",
              },
            },
          },
        },
      },
    });

    if (!question) throw new Error("Question not found");

    // Check access
    const isOwner = question.rfp.userId === userId;
    const isCollaborator = question.rfp.collaborators.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new Error("Unauthorized: You don't have access to this question");
    }

    const versions = await prisma.answerVersion.findMany({
      where: { questionId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { version: "desc" },
    });

    return versions;
  }
}

