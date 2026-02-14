import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../api/http';
import { endpoints } from '../api/endpoints';
import type { Speech, CreateSpeechDto, UpdateSpeechDto, ReorderSpeechesDto } from '../types/speech.types';

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const speechKeys = {
  all: ['speeches'] as const,
  byChapter: (chapterId: string) => ['speeches', chapterId] as const,
  byId: (id: string) => ['speech', id] as const,
};

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useSpeeches(chapterId: string | null) {
  return useQuery({
    queryKey: speechKeys.byChapter(chapterId ?? ''),
    queryFn: async (): Promise<Speech[]> => {
      const { data } = await http.get(endpoints.speeches.list(chapterId!));
      return data;
    },
    enabled: !!chapterId,
    staleTime: 30_000,
  });
}

export function useSpeech(id: string | null) {
  return useQuery({
    queryKey: speechKeys.byId(id ?? ''),
    queryFn: async (): Promise<Speech> => {
      const { data } = await http.get(endpoints.speeches.byId(id!));
      return data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateSpeech() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chapterId, dto }: { chapterId: string; dto: CreateSpeechDto }): Promise<Speech> => {
      const { data } = await http.post(endpoints.speeches.create(chapterId), dto);
      return data;
    },
    onSuccess: (speech) => {
      queryClient.invalidateQueries({ queryKey: speechKeys.byChapter(speech.chapterId) });
    },
  });
}

export function useUpdateSpeech() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateSpeechDto }): Promise<Speech> => {
      const { data } = await http.put(endpoints.speeches.byId(id), dto);
      return data;
    },
    onSuccess: (speech) => {
      queryClient.invalidateQueries({ queryKey: speechKeys.byChapter(speech.chapterId) });
      queryClient.setQueryData(speechKeys.byId(speech.id), speech);
    },
  });
}

export function useDeleteSpeech() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, chapterId: _chapterId }: { id: string; chapterId: string }): Promise<void> => {
      await http.delete(endpoints.speeches.byId(id));
    },
    onSuccess: (_data, { chapterId }) => {
      queryClient.invalidateQueries({ queryKey: speechKeys.byChapter(chapterId) });
    },
  });
}

export function useReorderSpeeches() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chapterId, dto }: { chapterId: string; dto: ReorderSpeechesDto }): Promise<void> => {
      await http.put(endpoints.speeches.reorder(chapterId), dto);
    },
    onSuccess: (_data, { chapterId }) => {
      queryClient.invalidateQueries({ queryKey: speechKeys.byChapter(chapterId) });
    },
  });
}

export interface BatchSpeechAudioDto {
  speechIds: string[];
  action: 'generate_audio';
}

export function useBatchSpeechAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chapterId, dto }: { chapterId: string; dto: BatchSpeechAudioDto }): Promise<void> => {
      await http.post(endpoints.speeches.bulk(chapterId), dto);
    },
    onSuccess: (_data, { chapterId }) => {
      queryClient.invalidateQueries({ queryKey: speechKeys.byChapter(chapterId) });
      queryClient.invalidateQueries({ queryKey: speechKeys.all });
    },
  });
}
