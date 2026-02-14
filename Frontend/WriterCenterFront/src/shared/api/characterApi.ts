/**
 * Character API Service
 * Handles all character-related API calls and TanStack Query integration
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from './http';
import { endpoints } from './endpoints';
import type { Character, CreateCharacterDto, UpdateCharacterDto } from '../types/character.types';
import type { CharacterFormData } from '../../features/studio/components/CharacterWizard/types/character-wizard.types';

interface VoicePreviewResponse {
  audioBase64?: string;
  audioUrl?: string;
  format?: string;
}

function normalizeAudioUrl(audioUrl: string): string {
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://') || audioUrl.startsWith('blob:')) {
    return audioUrl;
  }

  if (audioUrl.startsWith('/')) {
    return `${http.defaults.baseURL ?? ''}${audioUrl}`;
  }

  return `${http.defaults.baseURL ?? ''}/uploads/${audioUrl}`;
}

function base64ToObjectUrl(base64Audio: string, format?: string): string {
  const mimeType = format === 'wav' ? 'audio/wav' : 'audio/mpeg';
  const binary = window.atob(base64Audio);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Query keys for TanStack Query
 */
export const characterQueryKeys = {
  all: ['characters'] as const,
  lists: () => [...characterQueryKeys.all, 'list'] as const,
  list: (bookId: string) => [...characterQueryKeys.lists(), bookId] as const,
  details: () => [...characterQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...characterQueryKeys.details(), id] as const,
};

/**
 * Map CharacterFormData (from wizard) to CreateCharacterDto (for API)
 */
export function mapFormDataToCreateDto(
  data: CharacterFormData,
  bookId: string
): CreateCharacterDto {
  // For now, we create a simplified version that maps to the existing CreateCharacterDto
  // In the future, this might need to be expanded to include all the detailed fields
  return {
    bookId,
    name: data.name,
    role: 'supporting', // Default role - can be parameterized
    color: '#ef4444', // Default color - can be parameterized
    voiceId: data.voiceId,
    description: data.voiceDescription,
  };
}

/**
 * Map CharacterFormData to UpdateCharacterDto
 */
export function mapFormDataToUpdateDto(data: CharacterFormData): UpdateCharacterDto {
  return {
    name: data.name,
    role: 'supporting',
    color: '#ef4444',
    voiceId: data.voiceId,
    description: data.voiceDescription,
  };
}

/**
 * Get all characters for a book
 */
export function useCharacterList(bookId: string, enabled = true) {
  return useQuery({
    queryKey: characterQueryKeys.list(bookId),
    queryFn: async () => {
      const { data } = await http.get<Character[]>(
        endpoints.characters.list(bookId)
      );
      return data;
    },
    enabled: !!bookId && enabled,
  });
}

/**
 * Get a single character by ID
 */
export function useCharacterDetail(characterId: string, enabled = true) {
  return useQuery({
    queryKey: characterQueryKeys.detail(characterId),
    queryFn: async () => {
      const { data } = await http.get<Character>(
        endpoints.characters.byId(characterId)
      );
      return data;
    },
    enabled: !!characterId && enabled,
  });
}

/**
 * Create a new character
 */
export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateCharacterDto) => {
      const { data } = await http.post<Character>(
        endpoints.characters.create,
        dto
      );
      return data;
    },
    onSuccess: (newCharacter) => {
      // Invalidate and refetch the character list for the book
      queryClient.invalidateQueries({
        queryKey: characterQueryKeys.list(newCharacter.bookId),
      });
    },
    onError: (error: any) => {
      console.error('Error creating character:', error);
      throw new Error(
        error.response?.data?.message || 'Erro ao criar personagem'
      );
    },
  });
}

/**
 * Update an existing character
 */
export function useUpdateCharacter(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: UpdateCharacterDto) => {
      const { data } = await http.put<Character>(
        endpoints.characters.update(characterId),
        dto
      );
      return data;
    },
    onSuccess: (updatedCharacter) => {
      // Invalidate the specific character detail
      queryClient.invalidateQueries({
        queryKey: characterQueryKeys.detail(characterId),
      });

      // Invalidate the character list for the book
      queryClient.invalidateQueries({
        queryKey: characterQueryKeys.list(updatedCharacter.bookId),
      });
    },
    onError: (error: any) => {
      console.error('Error updating character:', error);
      throw new Error(
        error.response?.data?.message || 'Erro ao atualizar personagem'
      );
    },
  });
}

/**
 * Delete a character
 */
export function useDeleteCharacter(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (characterId: string) => {
      await http.delete(endpoints.characters.delete(characterId));
      return characterId;
    },
    onSuccess: () => {
      // Invalidate the character list for the book
      queryClient.invalidateQueries({
        queryKey: characterQueryKeys.list(bookId),
      });
    },
    onError: (error: any) => {
      console.error('Error deleting character:', error);
      throw new Error(
        error.response?.data?.message || 'Erro ao deletar personagem'
      );
    },
  });
}

/**
 * Preview voice audio for a character
 */
export function usePreviewVoice() {
  return useMutation({
    mutationFn: async (voiceId: string) => {
      const { data } = await http.post<VoicePreviewResponse>(
        endpoints.voices.preview,
        { voiceId }
      );

      if (data.audioUrl) {
        return {
          audioUrl: normalizeAudioUrl(data.audioUrl),
          revokeAfterPlay: false,
        };
      }

      if (data.audioBase64) {
        return {
          audioUrl: base64ToObjectUrl(data.audioBase64, data.format),
          revokeAfterPlay: true,
        };
      }

      throw new Error('Resposta de preview sem áudio.');
    },
    onError: (error: any) => {
      console.error('Error previewing voice:', error);
      throw new Error(
        error.response?.data?.message || 'Erro ao previewar voz'
      );
    },
  });
}

/**
 * Combined hook for the wizard: handles both create and update
 */
export function useCharacterWizardApi(bookId: string, characterId?: string) {
  // queryClient is available through mutations for cache invalidation
  const createMutation = useCreateCharacter();
  const updateMutation = useUpdateCharacter(characterId || '');
  const previewVoiceMutation = usePreviewVoice();

  return {
    /**
     * Save character (create or update)
     */
    saveCharacter: async (data: CharacterFormData) => {
      if (characterId) {
        // Update existing character
        const dto = mapFormDataToUpdateDto(data);
        return updateMutation.mutateAsync(dto);
      } else {
        // Create new character
        const dto = mapFormDataToCreateDto(data, bookId);
        return createMutation.mutateAsync(dto);
      }
    },

    /**
     * Preview voice
     */
    previewVoice: (voiceId: string) => {
      return previewVoiceMutation.mutateAsync(voiceId);
    },

    // Expose mutation states
    isLoading: createMutation.isPending || updateMutation.isPending,
    isError: createMutation.isError || updateMutation.isError,
    error: createMutation.error || updateMutation.error,
    isPreviewing: previewVoiceMutation.isPending,
    previewError: previewVoiceMutation.error,
  };
}
