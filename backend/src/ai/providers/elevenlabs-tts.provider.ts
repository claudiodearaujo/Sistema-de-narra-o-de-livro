import { AudioResult, GenerateAudioOptions, TTSProvider, Voice } from '../interfaces/tts-provider.interface';

export class ElevenLabsTTSProvider implements TTSProvider {
    readonly name = 'elevenlabs';
    readonly supportedFormats = ['mp3', 'wav'];

    async initialize(): Promise<void> {}
    async generateAudio(options: GenerateAudioOptions): Promise<AudioResult> { throw new Error('Not implemented'); }
    async getAvailableVoices(): Promise<Voice[]> { return []; }
    async previewVoice(voiceId: string, sampleText?: string): Promise<AudioResult> { throw new Error('Not implemented'); }
    async validateSSML(ssml: string): Promise<{ valid: boolean; errors?: string[] }> { return { valid: true }; }
}
