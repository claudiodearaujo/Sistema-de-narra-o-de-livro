/**
 * Tests for Character API Service
 * Tests TanStack Query integration, mutation handling, and API calls
 */

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useCreateCharacter, useUpdateCharacter, useCharacterList, useCharacterDetail, useDeleteCharacter, mapFormDataToCreateDto, mapFormDataToUpdateDto } from './characterApi';
import { http } from './http';
import type { CreateCharacterDto, UpdateCharacterDto, Character } from '../types/character.types';
import type { CharacterFormData } from '../../features/studio/components/CharacterWizard/types/character-wizard.types';

// Mock the http client
vi.mock('./http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Create a fresh QueryClient for each test
let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Character API', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Mapping', () => {
    it('should map CharacterFormData to CreateCharacterDto', () => {
      const formData: CharacterFormData = {
        name: 'John Doe',
        bookId: 'book-123',
        voiceId: 'voice-1',
        voiceDescription: 'Deep voice',
        identity: {
          age: 30,
          gender: 'Masculino',
        },
      };

      const dto = mapFormDataToCreateDto(formData, 'book-123');

      expect(dto.bookId).toBe('book-123');
      expect(dto.name).toBe('John Doe');
      expect(dto.voiceId).toBe('voice-1');
      expect(dto.description).toBe('Deep voice');
      expect(dto.role).toBe('supporting');
      expect(dto.color).toBe('#ef4444');
    });

    it('should map CharacterFormData to UpdateCharacterDto', () => {
      const formData: CharacterFormData = {
        name: 'Jane Doe',
        bookId: 'book-456',
        voiceId: 'voice-2',
        voiceDescription: 'Soft voice',
      };

      const dto = mapFormDataToUpdateDto(formData);

      expect(dto.name).toBe('Jane Doe');
      expect(dto.voiceId).toBe('voice-2');
      expect(dto.description).toBe('Soft voice');
    });
  });

  describe('useCreateCharacter', () => {
    it('should create a character successfully', async () => {
      const newCharacter: Character = {
        id: 'char-123',
        bookId: 'book-123',
        name: 'John Doe',
        role: 'supporting',
        color: '#ef4444',
        avatar: '',
        voiceId: 'voice-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(http.post).mockResolvedValue({
        data: newCharacter,
      } as any);

      const { result } = renderHook(() => useCreateCharacter(), {
        wrapper: createWrapper(),
      });

      const dto: CreateCharacterDto = {
        bookId: 'book-123',
        name: 'John Doe',
        role: 'supporting',
        color: '#ef4444',
        voiceId: 'voice-1',
      };

      let createdCharacter: Character | undefined;

      await act(async () => {
        createdCharacter = await result.current.mutateAsync(dto);
      });

      expect(createdCharacter).toEqual(newCharacter);
      expect(http.post).toHaveBeenCalled();
    });

    it('should handle creation error', async () => {
      const error = new Error('Creation failed');
      vi.mocked(http.post).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateCharacter(), {
        wrapper: createWrapper(),
      });

      const dto: CreateCharacterDto = {
        bookId: 'book-123',
        name: 'John Doe',
        role: 'supporting',
        color: '#ef4444',
        voiceId: 'voice-1',
      };

      await expect(result.current.mutateAsync(dto)).rejects.toThrow();
    });
  });

  describe('useUpdateCharacter', () => {
    it('should update a character successfully', async () => {
      const updatedCharacter: Character = {
        id: 'char-123',
        bookId: 'book-123',
        name: 'Jane Doe',
        role: 'supporting',
        color: '#3b82f6',
        avatar: '',
        voiceId: 'voice-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(http.put).mockResolvedValue({
        data: updatedCharacter,
      } as any);

      const { result } = renderHook(() => useUpdateCharacter('char-123'), {
        wrapper: createWrapper(),
      });

      const dto: UpdateCharacterDto = {
        name: 'Jane Doe',
        voiceId: 'voice-2',
        color: '#3b82f6',
      };

      let updated: Character | undefined;

      await act(async () => {
        updated = await result.current.mutateAsync(dto);
      });

      expect(updated).toEqual(updatedCharacter);
      expect(http.put).toHaveBeenCalled();
    });

    it('should handle update error', async () => {
      const error = new Error('Update failed');
      vi.mocked(http.put).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateCharacter('char-123'), {
        wrapper: createWrapper(),
      });

      const dto: UpdateCharacterDto = {
        name: 'Jane Doe',
      };

      await expect(result.current.mutateAsync(dto)).rejects.toThrow();
    });
  });

  describe('useCharacterList', () => {
    it('should fetch character list', async () => {
      const characters: Character[] = [
        {
          id: 'char-1',
          bookId: 'book-123',
          name: 'John',
          role: 'protagonist',
          color: '#ef4444',
          avatar: '',
          voiceId: 'voice-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'char-2',
          bookId: 'book-123',
          name: 'Jane',
          role: 'antagonist',
          color: '#3b82f6',
          avatar: '',
          voiceId: 'voice-2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      vi.mocked(http.get).mockResolvedValue({
        data: characters,
      } as any);

      const { result } = renderHook(() => useCharacterList('book-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(characters);
      expect(http.get).toHaveBeenCalled();
    });

    it('should not fetch if bookId is empty', () => {
      const { result } = renderHook(() => useCharacterList(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle list fetch error', async () => {
      const error = new Error('Fetch failed');
      vi.mocked(http.get).mockRejectedValue(error);

      const { result } = renderHook(() => useCharacterList('book-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useCharacterDetail', () => {
    it('should fetch character detail', async () => {
      const character: Character = {
        id: 'char-123',
        bookId: 'book-123',
        name: 'John Doe',
        role: 'supporting',
        color: '#ef4444',
        avatar: '',
        voiceId: 'voice-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(http.get).mockResolvedValue({
        data: character,
      } as any);

      const { result } = renderHook(() => useCharacterDetail('char-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(character);
    });

    it('should not fetch if characterId is empty', () => {
      const { result } = renderHook(() => useCharacterDetail(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useDeleteCharacter', () => {
    it('should delete a character successfully', async () => {
      vi.mocked(http.delete).mockResolvedValue({
        data: {},
      } as any);

      const { result } = renderHook(() => useDeleteCharacter('book-123'), {
        wrapper: createWrapper(),
      });

      let deleted: string | undefined;

      await act(async () => {
        deleted = await result.current.mutateAsync('char-123');
      });

      expect(deleted).toBe('char-123');
      expect(http.delete).toHaveBeenCalled();
    });

    it('should handle deletion error', async () => {
      const error = new Error('Deletion failed');
      vi.mocked(http.delete).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteCharacter('book-123'), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync('char-123')).rejects.toThrow();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate list cache after creating character', async () => {
      const newCharacter: Character = {
        id: 'char-123',
        bookId: 'book-123',
        name: 'John Doe',
        role: 'supporting',
        color: '#ef4444',
        avatar: '',
        voiceId: 'voice-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(http.post).mockResolvedValue({
        data: newCharacter,
      } as any);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateCharacter(), {
        wrapper: createWrapper(),
      });

      const dto: CreateCharacterDto = {
        bookId: 'book-123',
        name: 'John Doe',
        role: 'supporting',
        color: '#ef4444',
        voiceId: 'voice-1',
      };

      await act(async () => {
        await result.current.mutateAsync(dto);
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });
});
