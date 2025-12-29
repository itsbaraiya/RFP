//
// AI Chat Service for Proposal Builder
//

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ProposalContext {
  title?: string;
  description?: string;
  category?: string;
  aiPrompt?: string;
}

export class AIChatService {
  /**
   * Generate AI response for proposal builder chat
   */
  static async chat(
    messages: ChatMessage[],
    proposalContext?: ProposalContext
  ): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    const systemPrompt = this.buildSystemPrompt(proposalContext);
    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", 
        messages: chatMessages,
        temperature: 0.7, 
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from AI");
      }

      return response;
    } catch (error: any) {
      throw new Error(
        error.message || "Failed to get AI response. Please try again."
      );
    }
  }

  /**
   * Build system prompt with proposal context
   */
  private static buildSystemPrompt(context?: ProposalContext): string {
    let prompt = `You are an AI assistant helping users build professional Request for Proposals (RFPs). 
Your role is to provide helpful, concise, and actionable advice on:
- Writing clear and effective RFP sections
- Structuring proposals
- Best practices for RFP creation
- Answering questions about proposal content
- Suggesting improvements to proposal drafts

Keep your responses professional, concise (2-3 sentences when possible), and focused on helping create better RFPs.`;

    if (context) {
      prompt += "\n\nCurrent Proposal Context:";
      if (context.title) {
        prompt += `\n- Title: ${context.title}`;
      }
      if (context.description) {
        prompt += `\n- Description: ${context.description}`;
      }
      if (context.category) {
        prompt += `\n- Category: ${context.category}`;
      }
      if (context.aiPrompt) {
        prompt += `\n- Requirements: ${context.aiPrompt}`;
      }
      prompt +=
        "\n\nUse this context to provide relevant, tailored advice when appropriate.";
    }

    return prompt;
  }
}

