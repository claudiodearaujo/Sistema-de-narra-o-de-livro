import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../api/http';
import { endpoints } from '../api/endpoints';
import type { Chapter, CreateChapterDto, UpdateChapterDto } from '../types/chapter.types';

export const chapterKeys = {
  all: ['chapters'] as const,
  byBook: (bookId: string) => ['chapters', bookId] as const,
  byId: (id: string) => ['chapter', id] as const,
};

export function useChapters(bookId: string | null) {
  return useQuery({
    queryKey: chapterKeys.byBook(bookId ?? ''),
    queryFn: async (): Promise<Chapter[]> => {
      const { data } = await http.get(endpoints.chapters.list(bookId!));
      return data;
    },
    enabled: !!bookId,
    staleTime: 30_000,
  });
}

export function useChapter(id: string | null) {
  return useQuery({
    queryKey: chapterKeys.byId(id ?? ''),
    queryFn: async (): Promise<Chapter> => {
      const { data } = await http.get(endpoints.chapters.byId(id!));
      return data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateChapterDto): Promise<Chapter> => {
      const { data } = await http.post(endpoints.chapters.list(dto.bookId), dto);
      return data;
    },
    onSuccess: (chapter) => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.byBook(chapter.bookId) });
    },
  });
}

export function useUpdateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateChapterDto }): Promise<Chapter> => {
      const { data } = await http.patch(endpoints.chapters.byId(id), dto);
      return data;
    },
    onSuccess: (chapter) => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.byBook(chapter.bookId) });
      queryClient.setQueryData(chapterKeys.byId(chapter.id), chapter);
    },
  });
}
