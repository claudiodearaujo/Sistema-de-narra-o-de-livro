import { useMutation } from '@tanstack/react-query';
import { http } from '../api/http';
import { endpoints } from '../api/endpoints';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AiChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  bookId?: string;
  chapterId?: string;
  speechIds?: string[];
  stream?: boolean;
}

interface LegacyAiChatRequestContext {
  context?: {
    bookId?: string;
    chapterId?: string;
    speechIds?: string[];
  };
}

export interface AiChatResponse {
  message: string;
  suggestions?: string[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface SpellCheckRequest {
  speechIds: string[];
}

export interface SpellCheckResult {
  speechId: string;
  corrections: Array<{
    original: string;
    suggestion: string;
    position: number;
  }>;
}

export interface SuggestionsRequest {
  speechIds: string[];
  type: 'improve' | 'enrich' | 'rewrite';
}

export interface SuggestionsResult {
  speechId: string;
  suggestions: string[];
}

export interface CharacterContextRequest {
  speechIds: string[];
  characterId: string;
}

export interface EmotionImageRequest {
  speechId: string;
  emotion?: string;
}

function normalizeAiChatRequest(request: AiChatRequest & LegacyAiChatRequestContext): AiChatRequest {
  const { context, ...topLevelRequest } = request;

  return {
    ...topLevelRequest,
    bookId: topLevelRequest.bookId ?? context?.bookId,
    chapterId: topLevelRequest.chapterId ?? context?.chapterId,
    speechIds: topLevelRequest.speechIds ?? context?.speechIds,
  };
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAiChat() {
  return useMutation({
    mutationFn: async (request: AiChatRequest & LegacyAiChatRequestContext): Promise<AiChatResponse> => {
      const payload = normalizeAiChatRequest(request);
      const { data } = await http.post(endpoints.ai.chat, payload);
      return data;
    },
  });
}

export function useSpellCheck() {
  return useMutation({
    mutationFn: async (request: SpellCheckRequest): Promise<SpellCheckResult[]> => {
      const { data } = await http.post(endpoints.speeches.tools.spellCheck, request);
      return data;
    },
  });
}

export function useAiSuggestions() {
  return useMutation({
    mutationFn: async (request: SuggestionsRequest): Promise<SuggestionsResult[]> => {
      const { data } = await http.post(endpoints.speeches.tools.suggestions, request);
      return data;
    },
  });
}

export function useCharacterContext() {
  return useMutation({
    mutationFn: async (request: CharacterContextRequest): Promise<SuggestionsResult[]> => {
      const { data } = await http.post(endpoints.speeches.tools.characterContext, request);
      return data;
    },
  });
}

export function useEmotionImage() {
  return useMutation({
    mutationFn: async (request: EmotionImageRequest): Promise<{ imageUrl: string }> => {
      const { data } = await http.post(endpoints.speeches.tools.emotionImage, request);
      return data;
    },
  });
}
