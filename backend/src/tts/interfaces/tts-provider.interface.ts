export interface VoiceConfig {
    voiceId: string;
    description?: string;
    languageCode?: string;
    ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
}

export interface Voice {
    id: string;
    name: string;
    languageCode: string;
    gender: string;
    provider: string;
    previewUrl?: string;
    description?: string;
}

export interface GenerateAudioOptions {
    text: string;
    voice: VoiceConfig;
    useSSML?: boolean;
    outputFormat?: 'mp3' | 'wav' | 'ogg' | 'aac';
    speakingRate?: number; // 0.25 to 4.0
    pitch?: number; // -20.0 to 20.0
}

export interface AudioResult {
    buffer: Buffer;
    format: string;
    duration?: number;
    sampleRate?: number;
}

export interface TTSProvider {
    readonly name: string;
    readonly supportedFormats: string[];

    initialize(): Promise<void>;
    generateAudio(options: GenerateAudioOptions): Promise<AudioResult>;
    getAvailableVoices(): Promise<Voice[]>;
    previewVoice(voiceId: string, sampleText?: string): Promise<AudioResult>;
    validateSSML(ssml: string): Promise<{ valid: boolean; errors?: string[] }>;
}
