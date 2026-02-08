import { GoogleGenAI } from '@google/genai';
import { AudioResult, GenerateAudioOptions, TTSProvider, Voice } from '../../types/tts.types';
import { aiConfig } from '../../config/ai.config';
import { convertWavToMp3 } from '../../services/audio-converter';
import { rateLimiterManager } from '../../services/rate-limiter';

/**
 * 30 Fixed Gemini TTS Voices
 * Docs: https://ai.google.dev/gemini-api/docs/speech-generation
 */
const GEMINI_VOICES: Voice[] = [
    { id: 'Zephyr', name: 'Zephyr', languageCode: 'pt-BR', gender: 'NEUTRAL', provider: 'gemini', description: 'Bright - Cheerful' },
    { id: 'Puck', name: 'Puck', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Upbeat - Young' },
    { id: 'Charon', name: 'Charon', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Informative - Narrator' },
    { id: 'Kore', name: 'Kore', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Firm - Serious' },
    { id: 'Fenrir', name: 'Fenrir', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Excitable - Energetic' },
    { id: 'Leda', name: 'Leda', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Youthful' },
    { id: 'Orus', name: 'Orus', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Firm - Authoritative' },
    { id: 'Aoede', name: 'Aoede', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Breezy - Relaxed' },
    { id: 'Callirrhoe', name: 'Callirrhoe', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Easy-going - Calm' },
    { id: 'Autonoe', name: 'Autonoe', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Bright - Optimistic' },
    { id: 'Enceladus', name: 'Enceladus', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Breathy - Mysterious' },
    { id: 'Iapetus', name: 'Iapetus', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Clear - Crisp' },
    { id: 'Umbriel', name: 'Umbriel', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Easy-going - Relaxed' },
    { id: 'Algieba', name: 'Algieba', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Smooth - Gentle' },
    { id: 'Despina', name: 'Despina', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Smooth - Elegant' },
    { id: 'Erinome', name: 'Erinome', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Clear - Neutral' },
    { id: 'Algenib', name: 'Algenib', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Gravelly - Deep' },
    { id: 'Rasalgethi', name: 'Rasalgethi', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Informative' },
    { id: 'Laomedeia', name: 'Laomedeia', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Upbeat - Cheerful' },
    { id: 'Achernar', name: 'Achernar', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Soft - Delicate' },
    { id: 'Alnilam', name: 'Alnilam', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Firm - Assertive' },
    { id: 'Schedar', name: 'Schedar', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Even - Balanced narrator' },
    { id: 'Gacrux', name: 'Gacrux', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Mature - Experienced' },
    { id: 'Pulcherrima', name: 'Pulcherrima', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Forward - Assertive' },
    { id: 'Achird', name: 'Achird', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Friendly - Approachable' },
    { id: 'Zubenelgenubi', name: 'Zubenelgenubi', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Casual - Informal' },
    { id: 'Vindemiatrix', name: 'Vindemiatrix', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Gentle - Caring' },
    { id: 'Sadachbia', name: 'Sadachbia', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Lively - Vivacious' },
    { id: 'Sadaltager', name: 'Sadaltager', languageCode: 'pt-BR', gender: 'MALE', provider: 'gemini', description: 'Knowledgeable - Wise' },
    { id: 'Sulafat', name: 'Sulafat', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'gemini', description: 'Warm - Welcoming' }
];

export class GeminiTTSProvider implements TTSProvider {
    readonly name = 'gemini';
    readonly supportedFormats = ['mp3', 'wav'];
    private ai: GoogleGenAI;
    private rateLimiter;

    constructor() {
        this.ai = new GoogleGenAI({});
        this.rateLimiter = rateLimiterManager.get('gemini-tts', aiConfig.rateLimit.gemini);
    }

    async initialize(): Promise<void> {
        console.log('Gemini TTS Provider initialized');
        console.log(`   Model: ${aiConfig.providers.gemini?.ttsModel}`);
        console.log(`   Available voices: ${GEMINI_VOICES.length}`);
        console.log(`   Rate Limit: ${aiConfig.rateLimit.gemini.maxRequests} req/min`);
    }

    async generateAudio(options: GenerateAudioOptions): Promise<AudioResult> {
        const voiceName = options.voice.voiceId || aiConfig.tts.defaultVoice;
        const modelName = aiConfig.providers.gemini?.ttsModel || 'gemini-2.5-flash-preview-tts';

        console.log(`Generating audio with Gemini TTS`);
        console.log(`   Voice: ${voiceName}`);
        console.log(`   Text: ${options.text.substring(0, 50)}...`);

        return this.rateLimiter.execute(async () => {
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
                console.error('Response without audio:', JSON.stringify(response, null, 2));
                throw new Error('No audio data in response');
            }

            const wavBuffer = Buffer.from(audioData, 'base64');
            console.log(`WAV audio generated: ${wavBuffer.length} bytes`);

            console.log(`Converting to MP3...`);
            const mp3Buffer = await convertWavToMp3(wavBuffer);
            console.log(`MP3 audio generated: ${mp3Buffer.length} bytes`);

            return {
                buffer: mp3Buffer,
                format: 'mp3',
                sampleRate: 24000
            };
        });
    }

    async getAvailableVoices(): Promise<Voice[]> {
        return GEMINI_VOICES;
    }

    async previewVoice(voiceId: string, sampleText?: string): Promise<AudioResult> {
        const text = sampleText || `Hello! This is a preview of voice ${voiceId}. How are you today?`;
        return this.generateAudio({
            text,
            voice: { voiceId }
        });
    }

    async validateSSML(ssml: string): Promise<{ valid: boolean; errors?: string[] }> {
        return { valid: true };
    }
}
