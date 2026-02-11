import { Request, Response } from 'express';
import { AIService } from '../ai/ai.service';
import prisma from '../lib/prisma';

/**
 * Controller para geração de mídia avançada (imagens de cena, áudio ambiente)
 */
export class MediaController {
  private aiService: AIService;

  constructor() {
    this.aiService = AIService.getInstance();
  }

  /**
   * POST /api/speeches/:id/scene-image
   * Generate scene image for a speech using AI
   */
  async generateSceneImage(req: Request, res: Response) {
    try {
      const speechId = req.params.id as string;
      const { style, negativePrompt } = req.body;

      // Get speech with character and chapter info
      const speech = await prisma.speech.findUnique({
        where: { id: speechId },
        include: {
          character: true,
          chapter: {
            include: { book: true }
          }
        }
      });

      if (!speech) {
        return res.status(404).json({ error: 'Speech not found' });
      }

      // Build context for image generation
      const context: string[] = [];
      
      if (speech.chapter?.book) {
        context.push(`Livro: ${speech.chapter.book.title}`);
        if (speech.chapter.book.genre) {
          context.push(`Gênero: ${speech.chapter.book.genre}`);
        }
      }

      if (speech.chapter) {
        context.push(`Capítulo: ${speech.chapter.title}`);
      }

      if (speech.character) {
        context.push(`Personagem: ${speech.character.name}`);
      }

      // Generate image using emotion image endpoint (reuse existing functionality)
      const imageResult = await this.aiService.generateEmotionImage({
        text: speech.text,
        characterId: speech.characterId,
        styleHint: style || 'cinematic, detailed, high quality'
      });

      // Update speech with scene image URL
      const updatedSpeech = await prisma.speech.update({
        where: { id: speechId },
        data: { sceneImageUrl: imageResult.imageUrl }
      });

      res.json({
        success: true,
        speech: updatedSpeech,
        imageUrl: imageResult.imageUrl,
        prompt: imageResult.prompt
      });
    } catch (error: any) {
      console.error('[Media] Error generating scene image:', error);
      const status = error.message.includes('insuficiente') ? 402 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * POST /api/speeches/:id/ambient-audio
   * Generate ambient audio for a speech (placeholder - would integrate with audio generation service)
   */
  async generateAmbientAudio(req: Request, res: Response) {
    try {
      const speechId = req.params.id as string;
      const { ambientType, duration } = req.body;

      // Get speech
      const speech = await prisma.speech.findUnique({
        where: { id: speechId }
      });

      if (!speech) {
        return res.status(404).json({ error: 'Speech not found' });
      }

      // For now, return a placeholder response
      // In production, this would integrate with an ambient audio generation service
      // or use a library of pre-made ambient sounds

      const ambientAudioUrl = `/ambient/${ambientType || 'nature'}_${Date.now()}.mp3`;

      // Update speech with ambient audio URL
      const updatedSpeech = await prisma.speech.update({
        where: { id: speechId },
        data: { ambientAudioUrl }
      });

      res.json({
        success: true,
        speech: updatedSpeech,
        ambientAudioUrl,
        message: 'Ambient audio generation is a placeholder. In production, this would generate actual audio.'
      });
    } catch (error: any) {
      console.error('[Media] Error generating ambient audio:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/chapters/:id/soundtrack
   * Get soundtrack configuration for a chapter
   */
  async getChapterSoundtrack(req: Request, res: Response) {
    try {
      const chapterId = req.params.id as string;

      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: {
          id: true,
          title: true,
          soundtrackUrl: true,
          soundtrackVolume: true
        }
      });

      if (!chapter) {
        return res.status(404).json({ error: 'Chapter not found' });
      }

      res.json({
        chapterId: chapter.id,
        soundtrackUrl: chapter.soundtrackUrl,
        soundtrackVolume: chapter.soundtrackVolume || 0.5
      });
    } catch (error: any) {
      console.error('[Media] Error getting soundtrack:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/chapters/:id/soundtrack
   * Update soundtrack configuration for a chapter
   */
  async updateChapterSoundtrack(req: Request, res: Response) {
    try {
      const chapterId = req.params.id as string;
      const { soundtrackUrl, soundtrackVolume } = req.body;

      const updatedChapter = await prisma.chapter.update({
        where: { id: chapterId },
        data: {
          soundtrackUrl,
          soundtrackVolume: soundtrackVolume !== undefined ? soundtrackVolume : undefined
        },
        select: {
          id: true,
          title: true,
          soundtrackUrl: true,
          soundtrackVolume: true
        }
      });

      res.json({
        success: true,
        chapter: updatedChapter
      });
    } catch (error: any) {
      console.error('[Media] Error updating soundtrack:', error);
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Chapter not found' });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  /**
   * POST /api/chapters/:id/soundtrack/generate
   * Generate AI-powered soundtrack suggestion for a chapter
   */
  async generateSoundtrackSuggestion(req: Request, res: Response) {
    try {
      const chapterId = req.params.id as string;

      // Get chapter with speeches to understand mood
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          book: true,
          speeches: {
            take: 10,
            orderBy: { orderIndex: 'asc' }
          }
        }
      });

      if (!chapter) {
        return res.status(404).json({ error: 'Chapter not found' });
      }

      // Build context for AI
      const speechTexts = chapter.speeches.map(s => s.text).join(' ');
      const context = `
Livro: ${chapter.book?.title || 'Unknown'}
Capítulo: ${chapter.title}
Primeiras falas: ${speechTexts.substring(0, 500)}...
      `.trim();

      // Generate suggestion using AI
      const prompt = `Você é um especialista em trilhas sonoras e música ambiente para narrativas.
Analise o contexto abaixo e sugira uma trilha sonora apropriada.

${context}

Retorne um JSON com sugestões:
{
  "mood": "epic" | "calm" | "tense" | "romantic" | "mysterious",
  "tempo": "slow" | "medium" | "fast",
  "instruments": ["piano", "strings", "drums"],
  "description": "Descrição da trilha sugerida",
  "keywords": ["cinematic", "orchestral"]
}`;

      const response = await this.aiService['textProvider'].generateText({
        prompt,
        temperature: 0.4,
        responseFormat: 'json'
      });

      let suggestion;
      try {
        suggestion = JSON.parse(response.text);
      } catch {
        suggestion = {
          mood: 'calm',
          tempo: 'medium',
          instruments: ['piano'],
          description: 'Trilha suave e contemplativa',
          keywords: ['ambient']
        };
      }

      res.json({
        chapterId,
        suggestion,
        message: 'This is an AI suggestion. You would need to select actual music files based on these suggestions.'
      });
    } catch (error: any) {
      console.error('[Media] Error generating soundtrack suggestion:', error);
      const status = error.message.includes('insuficiente') ? 402 : 500;
      res.status(status).json({ error: error.message });
    }
  }
}

export const mediaController = new MediaController();
