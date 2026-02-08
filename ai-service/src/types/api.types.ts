/**
 * Types for API requests and responses
 */

import { AIOperationType, AIProviderName } from '@prisma/client';

// ========== Request Types ==========

export interface TTSGenerateRequest {
    text: string;
    voiceId: string;
    outputFormat?: 'mp3' | 'wav' | 'ogg' | 'aac';
    provider?: string;
    useCache?: boolean;
}

export interface TTSPreviewRequest {
    voiceId: string;
    sampleText?: string;
    provider?: string;
}

export interface TextSpellCheckRequest {
    text: string;
    language?: string;
}

export interface TextSuggestRequest {
    text: string;
    context?: {
        characterName?: string;
        characterDescription?: string;
        sceneDescription?: string;
    };
}

export interface TextEnrichRequest {
    text: string;
    characterData: {
        name: string;
        personality?: string;
        background?: string;
        traits?: string[];
    };
}

export interface ImageGenerateRequest {
    prompt: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
    style?: string;
}

export interface ImageEmotionRequest {
    text: string;
    characterData?: {
        name: string;
        appearance?: string;
    };
    styleHint?: string;
}

export interface SyncRequest {
    resourceType: string;
    resourceId: string;
    items: SyncItem[];
    provider?: string;
    background?: boolean;
    priority?: number;
    callbackUrl?: string;
}

export interface SyncItem {
    id: string;
    text: string;
    voiceId: string;
    orderIndex: number;
    metadata?: Record<string, any>;
}

// ========== Response Types ==========

export interface TTSGenerateResponse {
    audioBase64: string;
    audioUrl?: string;
    format: string;
    durationMs?: number;
    fromCache: boolean;
    usage: UsageInfo;
}

export interface VoiceListResponse {
    voices: Array<{
        voiceId: string;
        name: string;
        gender: string;
        language: string;
        description?: string;
        previewUrl?: string;
    }>;
    count: number;
    provider: string;
}

export interface TextSpellCheckResponse {
    originalText: string;
    correctedText: string;
    corrections: Array<{
        original: string;
        correction: string;
        position: number;
    }>;
    usage: UsageInfo;
}

export interface TextSuggestResponse {
    suggestions: Array<{
        type: 'style' | 'clarity' | 'tone' | 'grammar';
        original: string;
        suggestion: string;
        reason: string;
    }>;
    usage: UsageInfo;
}

export interface TextEnrichResponse {
    enrichedText: string;
    addedDetails: string[];
    usage: UsageInfo;
}

export interface ImageGenerateResponse {
    imageBase64?: string;
    imageUrl?: string;
    usage: UsageInfo;
}

export interface SyncResponse {
    jobId?: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    outputUrl?: string;
    totalDurationMs?: number;
    completedItems?: number;
    failedItems?: number;
    errors?: string[];
    timeline?: TimelineEntry[];
}

export interface TimelineEntry {
    itemId: string;
    orderIndex: number;
    audioDurationMs: number;
    startTimeMs: number;
    endTimeMs: number;
    audioUrl?: string;
    metadata?: Record<string, any>;
}

// ========== Usage & Cost Types ==========

export interface UsageInfo {
    operation: AIOperationType;
    provider: AIProviderName;
    creditsCost: number;
    estimatedUsd: number;
    durationMs: number;
}

export interface UsageSummary {
    period: string;
    totalOperations: number;
    totalCreditsSpent: number;
    totalEstimatedUsd: number;
    byOperation: Record<string, { count: number; credits: number; usd: number }>;
    byProvider: Record<string, { count: number; credits: number; usd: number }>;
}

export interface CostInfo {
    operation: string;
    credits: number;
    estimatedUsd: number;
}

// ========== Auth Types ==========

export interface AuthContext {
    userId: string;
    clientId: string;
    permissions: string[];
}

export interface ApiKeyInfo {
    id: string;
    name: string;
    permissions: string[];
    rateLimit: number;
    monthlyQuota?: number;
    usedQuota: number;
}

// ========== Error Types ==========

export interface ApiError {
    error: string;
    code?: string;
    details?: any;
}
