import { useMutation } from '@tanstack/react-query';
import { http } from '../api/http';
import { endpoints } from '../api/endpoints';

export interface SSMLTagSuggestion {
  tag: string;
  description: string;
  example: string;
  category: 'pause' | 'emphasis' | 'prosody' | 'effect' | 'other';
}

export interface SSMLPropertySuggestion {
  property: string;
  value: string;
  description: string;
  confidence: number;
}

export function useSSMLSuggestions() {
  const suggestTags = useMutation({
    mutationFn: async (params: {
      text: string;
      context?: string;
      emotion?: string;
    }) => {
      const { data } = await http.post<{ suggestions: SSMLTagSuggestion[] }>(
        endpoints.ssml.suggestTags,
        params
      );
      return data;
    },
  });

  const suggestProperties = useMutation({
    mutationFn: async (params: {
      text: string;
      characterName?: string;
      emotion?: string;
    }) => {
      const { data } = await http.post<{ properties: SSMLPropertySuggestion[] }>(
        endpoints.ssml.suggestProperties,
        params
      );
      return data;
    },
  });

  const applySuggestions = useMutation({
    mutationFn: async (params: {
      text: string;
      tags?: string[];
      properties?: Record<string, string>;
    }) => {
      const { data } = await http.post<{ ssmlText: string }>(
        endpoints.ssml.applySuggestions,
        params
      );
      return data;
    },
  });

  return {
    suggestTags,
    suggestProperties,
    applySuggestions,
  };
}
