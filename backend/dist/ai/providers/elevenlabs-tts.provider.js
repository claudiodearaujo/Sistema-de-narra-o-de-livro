"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElevenLabsTTSProvider = void 0;
const elevenlabs_js_1 = require("@elevenlabs/elevenlabs-js");
const ai_config_1 = require("../ai.config");
const rate_limiter_1 = require("../../utils/rate-limiter");
/**
 * Provider de TTS usando a API do ElevenLabs
 *
 * Funcionalidades:
 * - Listar vozes disponíveis (biblioteca + personalizadas)
 * - Gerar áudio a partir de texto
 * - Preview de vozes
 * - Suporte a múltiplos modelos (multilingual_v2, flash_v2_5, turbo_v2_5)
 * - Suporte a múltiplos formatos de saída
 */
// Mapeamento de formatos internos para formatos da API ElevenLabs
const OUTPUT_FORMAT_MAP = {
    'mp3': 'mp3_44100_128',
    'wav': 'pcm_44100',
    'ogg': 'mp3_44100_128', // fallback para mp3
    'aac': 'mp3_44100_128', // fallback para mp3
};
class ElevenLabsTTSProvider {
    constructor() {
        this.name = 'elevenlabs';
        this.supportedFormats = ['mp3', 'wav'];
        this.cachedVoices = null;
        this.cacheTimestamp = 0;
        const apiKey = ai_config_1.aiConfig.providers.elevenlabs?.apiKey || process.env.ELEVENLABS_API_KEY || '';
        this.client = new elevenlabs_js_1.ElevenLabsClient({ apiKey });
        this.rateLimiter = rate_limiter_1.rateLimiterManager.get('elevenlabs-tts', {
            maxRequests: ai_config_1.aiConfig.rateLimit.elevenlabs?.maxRequests ?? 10,
            windowMs: ai_config_1.aiConfig.rateLimit.elevenlabs?.windowMs ?? 60000,
            retryDelayMs: ai_config_1.aiConfig.rateLimit.elevenlabs?.retryDelayMs ?? 2000,
            maxRetries: ai_config_1.aiConfig.rateLimit.elevenlabs?.maxRetries ?? 3,
        });
    }
    async initialize() {
        const hasKey = !!(ai_config_1.aiConfig.providers.elevenlabs?.apiKey || process.env.ELEVENLABS_API_KEY);
        console.log('ElevenLabs TTS Provider inicializado');
        console.log(`   API Key configurada: ${hasKey ? 'Sim' : 'NAO - configure ELEVENLABS_API_KEY'}`);
        console.log(`   Modelo padrão: ${ai_config_1.aiConfig.providers.elevenlabs?.defaultModel || 'eleven_multilingual_v2'}`);
    }
    /**
     * Gera áudio a partir de texto usando ElevenLabs TTS
     */
    async generateAudio(options) {
        const voiceId = options.voice.voiceId || ai_config_1.aiConfig.providers.elevenlabs?.defaultVoice || 'Rachel';
        const modelId = ai_config_1.aiConfig.providers.elevenlabs?.defaultModel || 'eleven_multilingual_v2';
        const outputFormat = OUTPUT_FORMAT_MAP[options.outputFormat || 'mp3'] || 'mp3_44100_128';
        console.log(`Gerando áudio com ElevenLabs TTS`);
        console.log(`   Voz: ${voiceId}`);
        console.log(`   Modelo: ${modelId}`);
        console.log(`   Texto: ${options.text.substring(0, 50)}...`);
        return this.rateLimiter.execute(async () => {
            const audioStream = await this.client.textToSpeech.convert(voiceId, {
                text: options.text,
                modelId,
                outputFormat,
                voiceSettings: {
                    stability: ai_config_1.aiConfig.providers.elevenlabs?.voiceSettings?.stability ?? 0.5,
                    similarityBoost: ai_config_1.aiConfig.providers.elevenlabs?.voiceSettings?.similarityBoost ?? 0.75,
                    style: ai_config_1.aiConfig.providers.elevenlabs?.voiceSettings?.style ?? 0.0,
                    useSpeakerBoost: ai_config_1.aiConfig.providers.elevenlabs?.voiceSettings?.useSpeakerBoost ?? true,
                },
            });
            // Converter ReadableStream para Buffer
            const buffer = await this.streamToBuffer(audioStream);
            console.log(`Áudio ElevenLabs gerado: ${buffer.length} bytes`);
            return {
                buffer,
                format: options.outputFormat || 'mp3',
                sampleRate: 44100,
            };
        });
    }
    /**
     * Lista todas as vozes disponíveis na conta ElevenLabs
     */
    async getAvailableVoices() {
        // Retorna cache se ainda válido
        const cacheTTL = ai_config_1.aiConfig.tts.cacheVoicesTTL || 24 * 60 * 60 * 1000;
        if (this.cachedVoices && (Date.now() - this.cacheTimestamp) < cacheTTL) {
            return this.cachedVoices;
        }
        try {
            const response = await this.client.voices.search();
            const voices = [];
            if (response.voices) {
                for (const v of response.voices) {
                    voices.push({
                        id: v.voiceId || '',
                        name: v.name || 'Sem nome',
                        languageCode: 'multi', // ElevenLabs suporta multilíngue
                        gender: this.inferGender(v.labels),
                        provider: 'elevenlabs',
                        description: this.buildDescription(v),
                        previewUrl: v.previewUrl || undefined,
                    });
                }
            }
            this.cachedVoices = voices;
            this.cacheTimestamp = Date.now();
            console.log(`ElevenLabs: ${voices.length} vozes carregadas`);
            return voices;
        }
        catch (error) {
            console.error('Erro ao listar vozes ElevenLabs:', error.message);
            // Retorna cache expirado se existir
            if (this.cachedVoices) {
                return this.cachedVoices;
            }
            throw error;
        }
    }
    /**
     * Gera preview de áudio para uma voz
     */
    async previewVoice(voiceId, sampleText) {
        const text = sampleText || `Olá! Esta é uma prévia da voz. Como você está hoje?`;
        return this.generateAudio({
            text,
            voice: { voiceId },
        });
    }
    /**
     * Valida SSML - ElevenLabs não suporta SSML diretamente,
     * mas aceita tags de pronúncia
     */
    async validateSSML(ssml) {
        // ElevenLabs usa seu próprio formato de marcação, não SSML padrão
        // Aceita texto puro ou com tags básicas
        if (!ssml || ssml.trim().length === 0) {
            return { valid: false, errors: ['Texto vazio'] };
        }
        return { valid: true };
    }
    // ========== Helpers ==========
    /**
     * Converte ReadableStream para Buffer
     */
    async streamToBuffer(stream) {
        const chunks = [];
        if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
            for await (const chunk of stream) {
                chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
            }
        }
        else if (stream && typeof stream.read === 'function') {
            // Node.js Readable stream
            for await (const chunk of stream) {
                chunks.push(chunk instanceof Uint8Array ? chunk : Buffer.from(chunk));
            }
        }
        else if (Buffer.isBuffer(stream)) {
            return stream;
        }
        else {
            throw new Error('Formato de resposta de áudio não suportado');
        }
        return Buffer.concat(chunks);
    }
    /**
     * Infere o gênero com base nos labels da voz
     */
    inferGender(labels) {
        if (!labels)
            return 'NEUTRAL';
        const gender = labels.gender || labels.Gender || '';
        if (typeof gender === 'string') {
            const g = gender.toLowerCase();
            if (g.includes('male') && !g.includes('female'))
                return 'MALE';
            if (g.includes('female'))
                return 'FEMALE';
        }
        return 'NEUTRAL';
    }
    /**
     * Constrói descrição legível a partir dos dados da voz
     */
    buildDescription(voice) {
        const parts = [];
        if (voice.labels) {
            const labelEntries = Object.entries(voice.labels || {});
            for (const [key, value] of labelEntries) {
                if (value && key !== 'gender') {
                    parts.push(`${key}: ${value}`);
                }
            }
        }
        if (voice.description) {
            parts.push(voice.description);
        }
        return parts.join(' | ') || 'Voz ElevenLabs';
    }
}
exports.ElevenLabsTTSProvider = ElevenLabsTTSProvider;
