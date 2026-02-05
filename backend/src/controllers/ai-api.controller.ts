import { Request, Response } from 'express';
import { aiApiService } from '../services/ai-api.service';
import { aiTokenService } from '../services/ai-token.service';

/**
 * Controller da API de Inteligência Artificial
 *
 * Centraliza todos os endpoints de IA em /api/ai/*
 * Cada operação é rastreada com controle de tokens e custos.
 */
export class AIApiController {

    // ========== TTS Endpoints ==========

    /**
     * POST /api/ai/tts/generate
     * Gera áudio a partir de texto
     */
    async generateAudio(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { text, voiceId, outputFormat, provider } = req.body;

            if (!text?.trim()) {
                return res.status(400).json({ error: 'Texto é obrigatório' });
            }
            if (!voiceId?.trim()) {
                return res.status(400).json({ error: 'ID da voz é obrigatório' });
            }

            const result = await aiApiService.generateAudio(userId, {
                text,
                voiceId,
                outputFormat,
                provider,
            });

            res.json({
                audioBase64: result.data.audioBase64,
                format: result.data.format,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro ao gerar áudio:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * GET /api/ai/tts/voices
     * Lista todas as vozes disponíveis
     */
    async listVoices(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const provider = req.query.provider as string | undefined;

            const result = await aiApiService.listVoices(userId, {
                provider: provider as any,
            });

            res.json({
                voices: result.data,
                count: result.data.length,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro ao listar vozes:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/ai/tts/preview
     * Gera preview de áudio para uma voz
     */
    async previewVoice(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { voiceId, sampleText, provider } = req.body;

            if (!voiceId?.trim()) {
                return res.status(400).json({ error: 'ID da voz é obrigatório' });
            }

            const result = await aiApiService.previewVoice(userId, {
                voiceId,
                sampleText,
                provider,
            });

            res.json({
                audioBase64: result.data.audioBase64,
                format: result.data.format,
                voiceId,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro ao gerar preview:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * POST /api/ai/tts/narrate-chapter
     * Narra todas as falas de um capítulo
     */
    async narrateChapter(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { chapterId, provider } = req.body;

            if (!chapterId?.trim()) {
                return res.status(400).json({ error: 'ID do capítulo é obrigatório' });
            }

            const result = await aiApiService.narrateChapter(userId, {
                chapterId,
                provider,
            });

            res.json({
                speechCount: result.data.speechCount,
                completedCount: result.data.completedCount,
                errors: result.data.errors,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro na narração:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 400;
            res.status(status).json({ error: error.message });
        }
    }

    // ========== Text Endpoints ==========

    /**
     * POST /api/ai/text/spellcheck
     * Correção ortográfica
     */
    async spellCheck(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { text, language } = req.body;

            if (!text?.trim()) {
                return res.status(400).json({ error: 'Texto é obrigatório' });
            }

            const result = await aiApiService.spellCheck(userId, { text, language });

            res.json({
                ...result.data,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro no spellcheck:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * POST /api/ai/text/suggest
     * Sugestões de melhoria de texto
     */
    async suggestImprovements(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { text, characterId, chapterId, includeContext } = req.body;

            if (!text?.trim()) {
                return res.status(400).json({ error: 'Texto é obrigatório' });
            }

            const result = await aiApiService.suggestImprovements(userId, {
                text,
                characterId,
                chapterId,
                includeContext,
            });

            res.json({
                ...result.data,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro nas sugestões:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * POST /api/ai/text/enrich
     * Enriquecimento de texto com dados do personagem
     */
    async enrichWithCharacter(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { text, characterId } = req.body;

            if (!characterId?.trim()) {
                return res.status(400).json({ error: 'ID do personagem é obrigatório' });
            }

            const result = await aiApiService.enrichWithCharacter(userId, {
                text,
                characterId,
            });

            res.json({
                ...result.data,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro no enriquecimento:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    // ========== Image Endpoints ==========

    /**
     * POST /api/ai/image/generate
     * Geração de imagem a partir de prompt
     */
    async generateImage(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { prompt, negativePrompt, width, height, style } = req.body;

            if (!prompt?.trim()) {
                return res.status(400).json({ error: 'Prompt é obrigatório' });
            }

            const result = await aiApiService.generateImage(userId, {
                prompt,
                negativePrompt,
                width,
                height,
                style,
            });

            res.json({
                ...result.data,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro na geração de imagem:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * POST /api/ai/image/emotion
     * Geração de imagem emocional para texto/personagem
     */
    async generateEmotionImage(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { text, characterId, styleHint } = req.body;

            if (!text?.trim()) {
                return res.status(400).json({ error: 'Texto é obrigatório' });
            }

            const result = await aiApiService.generateEmotionImage(userId, {
                text,
                characterId,
                styleHint,
            });

            res.json({
                ...result.data,
                usage: result.usage,
            });
        } catch (error: any) {
            console.error('Erro na geração de imagem emocional:', error);
            const status = error.message.includes('Saldo insuficiente') ? 402 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    // ========== Usage & Info Endpoints ==========

    /**
     * GET /api/ai/usage
     * Resumo de uso de IA do usuário
     */
    async getUsage(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const period = (req.query.period as 'day' | 'week' | 'month') || 'month';

            const summary = await aiTokenService.getUsageSummary(userId, period);

            res.json({
                period,
                ...summary,
            });
        } catch (error: any) {
            console.error('Erro ao buscar uso:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/ai/costs
     * Lista custos de todas as operações de IA
     */
    async getCosts(req: Request, res: Response) {
        try {
            const costs = await aiTokenService.getAllCosts();

            res.json({ costs });
        } catch (error: any) {
            console.error('Erro ao buscar custos:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/ai/providers
     * Informações sobre providers disponíveis
     */
    async getProviders(req: Request, res: Response) {
        try {
            const info = aiApiService.getProviderInfo();
            res.json(info);
        } catch (error: any) {
            console.error('Erro ao buscar providers:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

export const aiApiController = new AIApiController();
