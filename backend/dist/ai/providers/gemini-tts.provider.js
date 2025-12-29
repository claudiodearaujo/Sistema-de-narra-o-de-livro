"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiTTSProvider = void 0;
const genai_1 = require("@google/genai");
const ai_config_1 = require("../ai.config");
const audio_converter_1 = require("../../utils/audio-converter");
/**
 * 30 Vozes Fixas do Gemini TTS
 * Documentação: https://ai.google.dev/gemini-api/docs/speech-generation?hl=pt-br#voices
 */
const GEMINI_VOICES = [
    { id: 'Zephyr', name: 'Zephyr', languageCode: 'pt-BR', gender: 'NEUTRAL', provider: 'gemini', description: 'Bright - Brilhante, alegre' },
    { id: 'Puck', name: 'Puck', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Upbeat - Animado, jovem' },
    { id: 'Charon', name: 'Charon', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Informative - Informativo, narrador' },
    { id: 'Kore', name: 'Kore', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Firm - Firme, séria' },
    { id: 'Fenrir', name: 'Fenrir', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Excitable - Excitável, energético' },
    { id: 'Leda', name: 'Leda', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Youthful - Juvenil' },
    { id: 'Orus', name: 'Orus', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Firm - Firme, autoritário' },
    { id: 'Aoede', name: 'Aoede', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Breezy - Leve, descontraída' },
    { id: 'Callirrhoe', name: 'Callirrhoe', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Easy-going - Tranquila, calma' },
    { id: 'Autonoe', name: 'Autonoe', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Bright - Brilhante, otimista' },
    { id: 'Enceladus', name: 'Enceladus', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Breathy - Sussurrado, misterioso' },
    { id: 'Iapetus', name: 'Iapetus', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Clear - Claro, nítido' },
    { id: 'Umbriel', name: 'Umbriel', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Easy-going - Tranquilo, relaxado' },
    { id: 'Algieba', name: 'Algieba', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Smooth - Suave, gentil' },
    { id: 'Despina', name: 'Despina', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Smooth - Suave, elegante' },
    { id: 'Erinome', name: 'Erinome', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Clear - Limpo, neutro' },
    { id: 'Algenib', name: 'Algenib', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Gravelly - Rouco, profundo' },
    { id: 'Rasalgethi', name: 'Rasalgethi', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Informative - Informativo' },
    { id: 'Laomedeia', name: 'Laomedeia', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Upbeat - Animada, alegre' },
    { id: 'Achernar', name: 'Achernar', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Soft - Suave, delicada' },
    { id: 'Alnilam', name: 'Alnilam', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Firm - Firme, assertivo' },
    { id: 'Schedar', name: 'Schedar', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Even - Equilibrado, narrador ideal' },
    { id: 'Gacrux', name: 'Gacrux', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Mature - Adulto, experiente' },
    { id: 'Pulcherrima', name: 'Pulcherrima', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Forward - Direta, assertiva' },
    { id: 'Achird', name: 'Achird', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Friendly - Amigável, simpático' },
    { id: 'Zubenelgenubi', name: 'Zubenelgenubi', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Casual - Informal, descontraído' },
    { id: 'Vindemiatrix', name: 'Vindemiatrix', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Gentle - Gentil, carinhosa' },
    { id: 'Sadachbia', name: 'Sadachbia', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Lively - Animado, vivaz' },
    { id: 'Sadaltager', name: 'Sadaltager', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Knowledgeable - Sábio, conhecedor' },
    { id: 'Sulafat', name: 'Sulafat', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Warm - Quente, acolhedora' }
];
class GeminiTTSProvider {
    constructor() {
        this.name = 'gemini';
        this.supportedFormats = ['mp3', 'wav'];
        this.ai = new genai_1.GoogleGenAI({});
    }
    async initialize() {
        console.log('✅ Gemini TTS Provider inicializado');
        console.log(`   Modelo: ${ai_config_1.aiConfig.providers.gemini?.ttsModel}`);
        console.log(`   Vozes disponíveis: ${GEMINI_VOICES.length}`);
    }
    async generateAudio(options) {
        const voiceName = options.voice.voiceId || ai_config_1.aiConfig.tts.defaultVoice;
        const modelName = ai_config_1.aiConfig.providers.gemini?.ttsModel || 'gemini-2.5-flash-preview-tts';
        console.log(`🎤 Gerando áudio com Gemini TTS`);
        console.log(`   Voz: ${voiceName}`);
        console.log(`   Texto: ${options.text.substring(0, 50)}...`);
        try {
            const response = await this.ai.models.generateContent({
                model: modelName,
                contents: [{ parts: [{ text: options.text }] }],
                config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voiceName
                            }
                        }
                    }
                }
            });
            const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!audioData) {
                console.error('Resposta sem áudio:', JSON.stringify(response, null, 2));
                throw new Error('Nenhum dado de áudio na resposta');
            }
            const wavBuffer = Buffer.from(audioData, 'base64');
            console.log(`✅ Áudio WAV gerado: ${wavBuffer.length} bytes`);
            console.log(`🔄 Convertendo para MP3...`);
            const mp3Buffer = await (0, audio_converter_1.convertWavToMp3)(wavBuffer);
            console.log(`✅ Áudio MP3 gerado: ${mp3Buffer.length} bytes`);
            return {
                buffer: mp3Buffer,
                format: 'mp3',
                sampleRate: 24000
            };
        }
        catch (error) {
            console.error('❌ Erro ao gerar áudio:', error);
            throw new Error(`Falha na geração de áudio: ${error.message}`);
        }
    }
    async getAvailableVoices() {
        return GEMINI_VOICES;
    }
    async previewVoice(voiceId, sampleText) {
        const text = sampleText || `Olá! Esta é uma prévia da voz ${voiceId}. Como você está hoje?`;
        return this.generateAudio({
            text,
            voice: { voiceId }
        });
    }
    async validateSSML(ssml) {
        return { valid: true };
    }
}
exports.GeminiTTSProvider = GeminiTTSProvider;
