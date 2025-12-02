"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsService = exports.TTSService = void 0;
const tts_factory_1 = require("./tts.factory");
class TTSService {
    constructor() {
        this.provider = tts_factory_1.TTSFactory.getDefault();
        this.provider.initialize().catch(err => {
            console.error('Failed to initialize default TTS provider:', err);
        });
    }
    static getInstance() {
        if (!TTSService.instance) {
            TTSService.instance = new TTSService();
        }
        return TTSService.instance;
    }
    async getAvailableVoices() {
        return this.provider.getAvailableVoices();
    }
    async previewVoice(voiceId, text) {
        return this.provider.previewVoice(voiceId, text);
    }
    async generateAudio(options) {
        return this.provider.generateAudio(options);
    }
    async validateSSML(ssml) {
        return this.provider.validateSSML(ssml);
    }
}
exports.TTSService = TTSService;
exports.ttsService = TTSService.getInstance();
