import { Request, Response } from 'express';
import { AIService } from '../ai/ai.service';
import prisma from '../lib/prisma';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  bookId?: string;
  chapterId?: string;
  speechIds?: string[];
  stream?: boolean;
}

/**
 * Controller para Chat IA com streaming
 */
export class AIChatController {
  private aiService: AIService;

  constructor() {
    this.aiService = AIService.getInstance();
  }

  /**
   * POST /api/ai/chat
   * Chat conversacional com IA, com suporte a streaming via SSE
   */
  async chat(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { message, history = [], bookId, chapterId, speechIds, stream = true }: ChatRequest = req.body;

      if (!message?.trim()) {
        return res.status(400).json({ error: 'Mensagem é obrigatória' });
      }

      // Build context from book/chapter/speeches
      const context = await this.buildContext({ bookId, chapterId, speechIds });

      // Prepare conversation history
      const conversationHistory = [
        ...history.map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`),
        `Usuário: ${message}`
      ].join('\n\n');

      const fullPrompt = context 
        ? `${context}\n\n---\n\nConversa:\n${conversationHistory}`
        : conversationHistory;

      // If streaming is requested, use SSE
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        try {
          // Use text provider to generate streaming response
          const response = await this.aiService['textProvider'].generateText({
            prompt: fullPrompt,
            stream: true
          });

          // If provider supports streaming
          if (response.stream) {
            for await (const chunk of response.stream) {
              const data = JSON.stringify({ delta: chunk });
              res.write(`data: ${data}\n\n`);
            }
            res.write('data: [DONE]\n\n');
          } else {
            // Fallback: send complete response as single chunk
            const data = JSON.stringify({ delta: response.text });
            res.write(`data: ${data}\n\n`);
            res.write('data: [DONE]\n\n');
          }

          res.end();
        } catch (error: any) {
          const errorData = JSON.stringify({ error: error.message });
          res.write(`data: ${errorData}\n\n`);
          res.end();
        }
      } else {
        // Non-streaming response
        const response = await this.aiService['textProvider'].generateText({
          prompt: fullPrompt,
          stream: false
        });

        res.json({
          message: response.text,
          usage: response.usage
        });
      }
    } catch (error: any) {
      console.error('[AI Chat] Error:', error);
      
      // If headers already sent (streaming), can't send JSON error
      if (res.headersSent) {
        res.end();
      } else {
        const status = error.message.includes('insuficiente') ? 402 : 500;
        res.status(status).json({ error: error.message });
      }
    }
  }

  /**
   * Build context from book, chapter, and speeches
   */
  private async buildContext(params: {
    bookId?: string;
    chapterId?: string;
    speechIds?: string[];
  }): Promise<string> {
    const sections: string[] = [];

    // Book context
    if (params.bookId) {
      const book = await prisma.book.findUnique({
        where: { id: params.bookId },
        select: { title: true, description: true }
      });

      if (book) {
        sections.push(`📚 Livro: ${book.title}`);
        if (book.description) {
          sections.push(`Descrição: ${book.description}`);
        }
      }
    }

    // Chapter context
    if (params.chapterId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: params.chapterId },
        select: { title: true, orderIndex: true }
      });

      if (chapter) {
        sections.push(`📖 Capítulo ${chapter.orderIndex + 1}: ${chapter.title}`);
      }
    }

    // Speeches context
    if (params.speechIds && params.speechIds.length > 0) {
      const speeches = await prisma.speech.findMany({
        where: { id: { in: params.speechIds } },
        include: { character: true },
        orderBy: { orderIndex: 'asc' }
      });

      if (speeches.length > 0) {
        sections.push('\n💬 Falas selecionadas:');
        speeches.forEach((speech, idx) => {
          const characterName = speech.character?.name || 'Narrador';
          sections.push(`${idx + 1}. [${characterName}]: ${speech.text}`);
        });
      }
    }

    return sections.length > 0 ? `Contexto:\n${sections.join('\n')}` : '';
  }
}

export const aiChatController = new AIChatController();
