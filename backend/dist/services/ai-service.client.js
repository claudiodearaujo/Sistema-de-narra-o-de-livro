"use strict";
/**
 * AI Service Client
 *
 * HTTP client for communicating with the standalone AI Service.
 * Replaces direct AI provider calls with API calls to the ai-service.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
class AIServiceClient {
    constructor() {
        const baseURL = process.env.AI_SERVICE_URL || 'http://localhost:3001/api';
        this.apiKey = process.env.AI_SERVICE_API_KEY || '';
        this.client = axios_1.default.create({
            baseURL,
            timeout: 120000, // 2 minutes for TTS generation
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': this.apiKey,
            },
        });
        // Request interceptor
        this.client.interceptors.request.use((config) => {
            console.log(`[AI-Service] ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        });
        // Response interceptor
        this.client.interceptors.response.use((response) => response, (error) => {
            const message = error.response?.data?.error || error.message;
            console.error(`[AI-Service] Error: ${message}`);
            throw new Error(message);
        });
    }
    /**
     * Set user context for requests
     */
    setUserContext(userId) {
        this.client.defaults.headers['X-User-Id'] = userId;
    }
    // ========== TTS Endpoints ==========
    /**
     * Generate audio from text
     */
    async generateAudio(request) {
        const response = await this.client.post('/tts/generate', request);
        return response.data;
    }
    /**
     * Generate voice preview
     */
    async previewVoice(request) {
        const response = await this.client.post('/tts/preview', request);
        return response.data;
    }
    /**
     * List available voices
     */
    async listVoices(provider) {
        const params = provider ? { provider } : {};
        const response = await this.client.get('/tts/voices', { params });
        return response.data;
    }
    /**
     * Generate audio for multiple items (batch)
     */
    async generateBatch(items, provider) {
        const response = await this.client.post('/tts/batch', { items, provider });
        return response.data;
    }
    /**
     * Get available TTS providers
     */
    async getProviders() {
        const response = await this.client.get('/tts/providers');
        return response.data;
    }
    // ========== Usage Endpoints ==========
    /**
     * Get usage summary
     */
    async getUsage(period) {
        const params = period ? { period } : {};
        const response = await this.client.get('/usage', { params });
        return response.data;
    }
    /**
     * Get costs for all operations
     */
    async getCosts() {
        const response = await this.client.get('/usage/costs');
        return response.data;
    }
    // ========== Admin Endpoints ==========
    /**
     * Get platform statistics (admin only)
     */
    async getPlatformStats(period) {
        const params = period ? { period } : {};
        const response = await this.client.get('/admin/stats', { params });
        return response.data;
    }
    /**
     * Get usage history (admin only)
     */
    async getUsageHistory(days) {
        const params = days ? { days } : {};
        const response = await this.client.get('/admin/history', { params });
        return response.data;
    }
    /**
     * Update operation cost (admin only)
     */
    async updateCost(operation, credits) {
        const response = await this.client.put(`/admin/costs/${operation}`, { credits });
        return response.data;
    }
    /**
     * Get cache statistics (admin only)
     */
    async getCacheStats() {
        const response = await this.client.get('/admin/cache/stats');
        return response.data;
    }
    /**
     * Clean cache (admin only)
     */
    async cleanCache(type, daysUnused) {
        const response = await this.client.post('/admin/cache/clean', { type, daysUnused });
        return response.data;
    }
    // ========== Health Check ==========
    /**
     * Check AI service health
     */
    async healthCheck() {
        const response = await this.client.get('/health');
        return response.data;
    }
}
// Singleton instance
exports.aiServiceClient = new AIServiceClient();
