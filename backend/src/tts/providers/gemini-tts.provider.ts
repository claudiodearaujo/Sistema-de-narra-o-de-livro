import { GoogleGenerativeAI } from '@google/generative-ai';
import * as googleTTS from 'google-tts-api';
import axios from 'axios';
import { AudioResult, GenerateAudioOptions, TTSProvider, Voice } from '../interfaces/tts-provider.interface';
import { ttsConfig } from '../tts.config';

export class GeminiTTSProvider implements TTSProvider {
    readonly name = 'gemini';
    readonly supportedFormats = ['mp3'];
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = ttsConfig.providers.gemini?.apiKey;
        if (!apiKey) {
            throw new Error('Gemini API Key not configured');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async initialize(): Promise<void> {
        // Initialize model or validate connection
        const modelName = ttsConfig.providers.gemini?.model || 'gemini-2.0-flash-exp';
        this.model = this.genAI.getGenerativeModel({ model: modelName });
    }

    async generateAudio(options: GenerateAudioOptions): Promise<AudioResult> {
        console.log(`Generating audio with Google TTS API for voice: ${options.voice.voiceId}`);

        try {
            // Remove SSML tags if present, as the simple API doesn't support it
            let textToSpeak = options.text;
            if (options.useSSML) {
                // Strip SSML tags for simple text
                textToSpeak = options.text
                    .replace(/<[^>]*>/g, '') // Remove all HTML/SSML tags
                    .replace(/\s+/g, ' ')    // Normalize whitespace
                    .trim();
            }

            // Map voice to language code
            const languageCode = this.getLanguageFromVoice(options.voice.voiceId);
            
            // Get the TTS URL from google-tts-api
            const audioUrls = googleTTS.getAllAudioUrls(textToSpeak, {
                lang: languageCode,
                slow: false,
                host: 'https://translate.google.com',
                splitPunct: ',.?!'
            });

            // Download all audio chunks and concatenate
            const audioBuffers: Buffer[] = [];
            
            for (const audioUrl of audioUrls) {
                const response = await axios.get(audioUrl.url, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                audioBuffers.push(Buffer.from(response.data));
            }

            // Concatenate all buffers
            const finalBuffer = Buffer.concat(audioBuffers);

            console.log(`Audio generated successfully. Buffer size: ${finalBuffer.length} bytes`);

            return {
                buffer: finalBuffer,
                format: 'mp3',
                duration: undefined
            };
        } catch (error: any) {
            console.error('Error generating audio with Google TTS API:', error);
            throw new Error(`Failed to generate audio: ${error.message}`);
        }
    }

    private getLanguageFromVoice(voiceId: string): string {
        // Extract language code from voice ID
        if (voiceId.startsWith('pt-BR')) return 'pt-BR';
        if (voiceId.startsWith('en-US')) return 'en-US';
        if (voiceId.startsWith('es-ES')) return 'es-ES';
        // Default to Portuguese Brazil
        return 'pt-BR';
    }

    async getAvailableVoices(): Promise<Voice[]> {
        // Google Cloud TTS voices for Brazilian Portuguese
        return [
            { id: 'pt-BR-Standard-A', name: 'Feminina Padrão A', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'google-tts', description: 'Voz feminina natural' },
            { id: 'pt-BR-Standard-B', name: 'Masculina Padrão B', languageCode: 'pt-BR', gender: 'MALE', provider: 'google-tts', description: 'Voz masculina natural' },
            { id: 'pt-BR-Standard-C', name: 'Feminina Padrão C', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'google-tts', description: 'Voz feminina suave' },
            { id: 'pt-BR-Wavenet-A', name: 'Feminina Neural A', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'google-tts', description: 'Voz feminina de alta qualidade' },
            { id: 'pt-BR-Wavenet-B', name: 'Masculina Neural B', languageCode: 'pt-BR', gender: 'MALE', provider: 'google-tts', description: 'Voz masculina de alta qualidade' },
            { id: 'pt-BR-Wavenet-C', name: 'Feminina Neural C', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'google-tts', description: 'Voz feminina expressiva' },
            { id: 'pt-BR-Neural2-A', name: 'Feminina Neural2 A', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'google-tts', description: 'Última geração feminina' },
            { id: 'pt-BR-Neural2-B', name: 'Masculina Neural2 B', languageCode: 'pt-BR', gender: 'MALE', provider: 'google-tts', description: 'Última geração masculina' },
            { id: 'pt-BR-Neural2-C', name: 'Feminina Neural2 C', languageCode: 'pt-BR', gender: 'FEMALE', provider: 'google-tts', description: 'Última geração feminina suave' }
        ];
    }

    async previewVoice(voiceId: string, sampleText?: string): Promise<AudioResult> {
        return this.generateAudio({
            text: sampleText || `This is a preview of the voice ${voiceId}`,
            voice: { voiceId }
        });
    }

    async validateSSML(ssml: string): Promise<{ valid: boolean; errors?: string[] }> {
        // Basic validation logic (can be expanded)
        const errors: string[] = [];
        
        // Auto-wrap with <speak> tag if not present
        let validatedSsml = ssml.trim();
        if (!validatedSsml.startsWith('<speak>')) {
            validatedSsml = `<speak>${validatedSsml}</speak>`;
        }
        
        // Check if closing tag is present
        if (!validatedSsml.endsWith('</speak>')) {
            errors.push('Missing closing </speak> tag');
        }
        
        // Additional basic validation can be added here
        // For example: check for balanced tags, valid SSML elements, etc.
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
