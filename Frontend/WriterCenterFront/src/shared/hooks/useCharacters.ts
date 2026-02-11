import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../api/http';
import { endpoints } from '../api/endpoints';
import type { Character, CreateCharacterDto, UpdateCharacterDto } from '../types/character.types';

export const characterKeys = {
  all: ['characters'] as const,
  byBook: (bookId: string) => ['characters', bookId] as const,
  byId: (id: string) => ['character', id] as const,
};

// Special constant ID for narrator (no real character)
export const NARRATOR_ID = 'narrator';

export function useCharacters(bookId: string | null) {
  return useQuery({
    queryKey: characterKeys.byBook(bookId ?? ''),
    queryFn: async (): Promise<Character[]> => {
      const { data } = await http.get(endpoints.characters.list(bookId!));
      return data;
    },
    enabled: !!bookId,
    staleTime: 60_000,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateCharacterDto): Promise<Character> => {
      const { data } = await http.post(endpoints.characters.create, dto);
      return data;
    },
    onSuccess: (character) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.byBook(character.bookId) });
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateCharacterDto }): Promise<Character> => {
      const { data } = await http.patch(endpoints.characters.byId(id), dto);
      return data;
    },
    onSuccess: (character) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.byBook(character.bookId) });
      queryClient.setQueryData(characterKeys.byId(character.id), character);
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bookId }: { id: string; bookId: string }): Promise<void> => {
      await http.delete(endpoints.characters.byId(id));
    },
    onSuccess: (_data, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.byBook(bookId) });
    },
  });
}
