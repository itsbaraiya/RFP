//
// Answer Generation Service
// Generates AI answers with source tracking and confidence scoring
//

import { PrismaClient, SourceType } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AnswerSource {
  sourceType: SourceType;
  sourceId?: string;
  sourceName: string;
  relevanceScore: number;
  metadata?: any;
}

export class AnswerGenerationService {
  /**
   * Generate answer for a single question
   * Tracks sources and calculates confidence score
   */
  static async generateAnswer(
    questionId: number,
    userId: number,
    options?: {
      usePreviousResponses?: boolean;
      useContentLibrary?: boolean;
      maxSources?: number;
    }
  ) {
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
      },
    });

    if (!question) throw new Error("Question not found");

    // Check access
    const isOwner = question.rfp.userId === userId;
    const isCollaborator = question.rfp.collaborators.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new Error("Unauthorized: You don't have access to this question");
    }

    const sources: AnswerSource[] = [];
    let answerText = "";
    let confidenceScore = 0;

    // Step 1: Search for previous responses (if enabled)
    if (options?.usePreviousResponses !== false) {
      const previousAnswers = await this.searchPreviousResponses(question.questionText);
      sources.push(...previousAnswers);
    }

    // Step 2: Search content library (if enabled)
    if (options?.useContentLibrary !== false) {
      const libraryAnswers = await this.searchContentLibrary(question.questionText);
      sources.push(...libraryAnswers);
    }

    // Step 3: Generate answer using best sources
    if (sources.length > 0) {
      // Use top sources to generate answer
      const topSources = sources
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, options?.maxSources || 3);

      answerText = await this.generateFromSources(question.questionText, topSources);
      confidenceScore = this.calculateConfidenceScore(topSources);
    } else {
      // No sources found - use AI writing tools
      answerText = await this.generateWithAI(question.questionText, question.rfp.title);
      confidenceScore = 50; // Lower confidence when no sources
      sources.push({
        sourceType: SourceType.AI_GENERATED,
        sourceName: "AI Generated (No sources found)",
        relevanceScore: 0.5,
      });
    }

    // Step 4: Check word count requirement
    const wordCount = question.wordCount;
    if (wordCount && answerText) {
      const actualWordCount = answerText.split(/\s+/).length;
      if (Math.abs(actualWordCount - wordCount) > 5) {
        // Adjust answer to meet word count
        answerText = await this.adjustWordCount(answerText, wordCount);
      }
    }

    // Step 5: Save answer and sources
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        aiSuggestedAnswer: answerText,
        confidenceScore: Math.round(confidenceScore),
      },
    });

    // Save sources
    if (sources.length > 0) {
      await prisma.answerSource.createMany({
        data: sources.map(source => ({
          questionId,
          sourceType: source.sourceType,
          sourceId: source.sourceId,
          sourceName: source.sourceName,
          relevanceScore: source.relevanceScore,
          metadata: source.metadata || {},
        })),
      });
    }

    return {
      question: updatedQuestion,
      sources: sources.slice(0, 5), // Return top 5
      confidenceScore: Math.round(confidenceScore),
    };
  }

  /**
   * Generate answers for multiple questions (bulk operation)
   */
  static async generateAnswersBulk(
    rfpId: number,
    userId: number,
    questionIds?: number[],
    options?: {
      usePreviousResponses?: boolean;
      useContentLibrary?: boolean;
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

    // Get questions to process
    const where: any = { rfpId };
    if (questionIds && questionIds.length > 0) {
      where.id = { in: questionIds };
    }

    const questions = await prisma.question.findMany({
      where,
      select: {
        id: true,
        questionText: true,
        wordCount: true,
      },
    });

    const results = [];
    for (const question of questions) {
      try {
        const result = await this.generateAnswer(question.id, userId, options);
        results.push({
          questionId: question.id,
          success: true,
          confidenceScore: result.confidenceScore,
          sourcesCount: result.sources.length,
        });
      } catch (error: any) {
        results.push({
          questionId: question.id,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      total: questions.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  /**
   * Search previous RFP responses for similar questions
   */
  private static async searchPreviousResponses(questionText: string): Promise<AnswerSource[]> {
    // Find similar questions from previous RFPs
    const similarQuestions = await prisma.question.findMany({
      where: {
        status: "APPROVED",
        finalAnswer: { not: null },
      },
      select: {
        id: true,
        questionText: true,
        finalAnswer: true,
        rfp: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      take: 10,
    });

    // Calculate similarity (simple keyword matching for now)
    const sources: AnswerSource[] = [];
    const questionKeywords = questionText.toLowerCase().split(/\s+/);

    for (const q of similarQuestions) {
      const similarity = this.calculateSimilarity(questionText, q.questionText);
      if (similarity > 0.3) {
        sources.push({
          sourceType: SourceType.PREVIOUS_RESPONSE,
          sourceId: q.rfp.id.toString(),
          sourceName: `Previous RFP: ${q.rfp.title}`,
          relevanceScore: similarity,
          metadata: {
            questionId: q.id,
            rfpId: q.rfp.id,
            rfpTitle: q.rfp.title,
          },
        });
      }
    }

    return sources;
  }

  /**
   * Search content library (placeholder - to be implemented)
   */
  private static async searchContentLibrary(questionText: string): Promise<AnswerSource[]> {
    // TODO: Implement content library search
    // For now, return empty array
    return [];
  }

  /**
   * Generate answer from sources
   */
  private static async generateFromSources(
    questionText: string,
    sources: AnswerSource[]
  ): Promise<string> {
    const sourceContext = sources.map(s => s.sourceName).join(", ");

    const prompt = `Based on the following sources, provide a comprehensive answer to this question:

Question: ${questionText}

Sources: ${sourceContext}

Provide a detailed, professional answer that addresses the question thoroughly.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert RFP response writer. Generate professional, accurate answers based on provided sources.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Error generating answer from sources:", error);
      return "";
    }
  }

  /**
   * Generate answer with AI (when no sources available)
   */
  private static async generateWithAI(questionText: string, rfpTitle: string): Promise<string> {
    const prompt = `You are an expert RFP response writer. Answer this question professionally and comprehensively:

Question: ${questionText}

Context: This is for an RFP titled "${rfpTitle}"

Provide a detailed, professional answer.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert RFP response writer. Generate professional, accurate answers.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Error generating AI answer:", error);
      throw new Error("Failed to generate answer");
    }
  }

  /**
   * Adjust answer to meet word count requirement
   */
  private static async adjustWordCount(answer: string, targetWordCount: number): Promise<string> {
    const currentWordCount = answer.split(/\s+/).length;

    if (Math.abs(currentWordCount - targetWordCount) <= 5) {
      return answer; // Close enough
    }

    const prompt = `Adjust this answer to be exactly ${targetWordCount} words:

Current answer (${currentWordCount} words):
${answer}

Provide the adjusted answer that is exactly ${targetWordCount} words while maintaining all key information and professional tone.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at adjusting text to meet specific word count requirements while maintaining quality.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || answer;
    } catch (error) {
      console.error("Error adjusting word count:", error);
      return answer; // Return original if adjustment fails
    }
  }

  /**
   * Calculate confidence score based on sources
   */
  private static calculateConfidenceScore(sources: AnswerSource[]): number {
    if (sources.length === 0) return 0;

    // Base score from top source
    const topSource = sources[0];
    let score = topSource.relevanceScore * 100;

    // Bonus for multiple sources
    if (sources.length > 1) {
      score += Math.min(sources.length * 5, 20); // Up to 20 points for multiple sources
    }

    // Bonus for high relevance
    if (topSource.relevanceScore > 0.8) {
      score += 10;
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Simple similarity calculation (keyword-based)
   * TODO: Replace with better semantic similarity (embeddings)
   */
  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size; // Jaccard similarity
  }
}

