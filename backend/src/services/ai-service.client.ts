/**
 * AI Service Client
 *
 * HTTP client for communicating with the standalone AI Service.
 * Replaces direct AI provider calls with API calls to the ai-service.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export interface TTSGenerateRequest {
    text: string;
    voiceId: string;
    outputFormat?: 'mp3' | 'wav' | 'ogg' | 'aac';
    provider?: string;
    useCache?: boolean;
}

export interface TTSGenerateResponse {
    audioBase64: string;
    audioUrl?: string;
    format: string;
    durationMs?: number;
    fromCache: boolean;
    usage: UsageInfo;
}

export interface TTSPreviewRequest {
    voiceId: string;
    sampleText?: string;
    provider?: string;
}

export interface VoiceInfo {
    voiceId: string;
    name: string;
    gender: string;
    language: string;
    description?: string;
    previewUrl?: string;
}

export interface UsageInfo {
    operation: string;
    provider: string;
    creditsCost: number;
    estimatedUsd: number;
    durationMs: number;
}

export interface UsageSummary {
    period: string;
    totalOperations: number;
    totalCreditsSpent: number;
    totalEstimatedUsd: number;
    byOperation: Record<string, { count: number; credits: number }>;
    byProvider: Record<string, { count: number; credits: number }>;
}

export interface BatchItem {
    id: string;
    text: string;
    voiceId: string;
}

export interface BatchResult {
    id: string;
    success: boolean;
    audioUrl?: string;
    durationMs?: number;
    error?: string;
}

class AIServiceClient {
    private client: AxiosInstance;
    private apiKey: string;

    constructor() {
        const baseURL = process.env.AI_SERVICE_URL || 'http://localhost:3001/api';
        this.apiKey = process.env.AI_SERVICE_API_KEY || '';

        this.client = axios.create({
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
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                const message = (error.response?.data as any)?.error || error.message;
                console.error(`[AI-Service] Error: ${message}`);
                throw new Error(message);
            }
        );
    }

    /**
     * Set user context for requests
     */
    setUserContext(userId: string): void {
        this.client.defaults.headers['X-User-Id'] = userId;
    }

    // ========== TTS Endpoints ==========

    /**
     * Generate audio from text
     */
    async generateAudio(request: TTSGenerateRequest): Promise<TTSGenerateResponse> {
        const response = await this.client.post<TTSGenerateResponse>('/tts/generate', request);
        return response.data;
    }

    /**
     * Generate voice preview
     */
    async previewVoice(request: TTSPreviewRequest): Promise<TTSGenerateResponse> {
        const response = await this.client.post<TTSGenerateResponse>('/tts/preview', request);
        return response.data;
    }

    /**
     * List available voices
     */
    async listVoices(provider?: string): Promise<{ voices: VoiceInfo[]; count: number; provider: string }> {
        const params = provider ? { provider } : {};
        const response = await this.client.get('/tts/voices', { params });
        return response.data;
    }

    /**
     * Generate audio for multiple items (batch)
     */
    async generateBatch(
        items: BatchItem[],
        provider?: string
    ): Promise<{
        totalItems: number;
        successCount: number;
        failedCount: number;
        results: BatchResult[];
    }> {
        const response = await this.client.post('/tts/batch', { items, provider });
        return response.data;
    }

    /**
     * Get available TTS providers
     */
    async getProviders(): Promise<{ tts: { current: string; available: string[] } }> {
        const response = await this.client.get('/tts/providers');
        return response.data;
    }

    // ========== Usage Endpoints ==========

    /**
     * Get usage summary
     */
    async getUsage(period?: 'day' | 'week' | 'month'): Promise<UsageSummary> {
        const params = period ? { period } : {};
        const response = await this.client.get('/usage', { params });
        return response.data;
    }

    /**
     * Get costs for all operations
     */
    async getCosts(): Promise<{ costs: Record<string, { credits: number; estimatedUsd: number }> }> {
        const response = await this.client.get('/usage/costs');
        return response.data;
    }

    // ========== Admin Endpoints ==========

    /**
     * Get platform statistics (admin only)
     */
    async getPlatformStats(period?: 'day' | 'week' | 'month'): Promise<any> {
        const params = period ? { period } : {};
        const response = await this.client.get('/admin/stats', { params });
        return response.data;
    }

    /**
     * Get usage history (admin only)
     */
    async getUsageHistory(days?: number): Promise<any> {
        const params = days ? { days } : {};
        const response = await this.client.get('/admin/history', { params });
        return response.data;
    }

    /**
     * Update operation cost (admin only)
     */
    async updateCost(operation: string, credits: number): Promise<any> {
        const response = await this.client.put(`/admin/costs/${operation}`, { credits });
        return response.data;
    }

    /**
     * Get cache statistics (admin only)
     */
    async getCacheStats(): Promise<any> {
        const response = await this.client.get('/admin/cache/stats');
        return response.data;
    }

    /**
     * Clean cache (admin only)
     */
    async cleanCache(type: 'expired' | 'unused' | 'all', daysUnused?: number): Promise<any> {
        const response = await this.client.post('/admin/cache/clean', { type, daysUnused });
        return response.data;
    }

    // ========== Health Check ==========

    /**
     * Check AI service health
     */
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        const response = await this.client.get('/health');
        return response.data;
    }
}

// Singleton instance
export const aiServiceClient = new AIServiceClient();
