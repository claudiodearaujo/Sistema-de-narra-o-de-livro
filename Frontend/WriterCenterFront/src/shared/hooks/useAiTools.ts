import { useMutation } from '@tanstack/react-query';
import { http } from '../api/http';
import { endpoints } from '../api/endpoints';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AiChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: {
    bookId?: string;
    chapterId?: string;
    speechIds?: string[];
  };
}

export interface AiChatResponse {
  message: string;
  suggestions?: string[];
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

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAiChat() {
  return useMutation({
    mutationFn: async (request: AiChatRequest): Promise<AiChatResponse> => {
      const { data } = await http.post(endpoints.ai.chat, request);
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
