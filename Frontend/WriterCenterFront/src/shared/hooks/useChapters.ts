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
      console.log('[useChapters] Fetching chapters for bookId:', bookId);
      const endpoint = endpoints.chapters.list(bookId!);
      console.log('[useChapters] Endpoint:', endpoint);
      console.log('[useChapters] Base URL:', http.defaults.baseURL);
      try {
        const response = await http.get(endpoint);
        console.log('[useChapters] Response status:', response.status);

        // Handle both direct array and wrapped { data: [...] } responses
        const raw = response.data;
        const chapters: Chapter[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : [];

        console.log('[useChapters] Chapters loaded:', chapters.length);

        if (chapters.length === 0 && raw && !Array.isArray(raw)) {
          console.warn('[useChapters] Unexpected response format:', typeof raw, JSON.stringify(raw).slice(0, 300));
        }

        return chapters;
      } catch (error: unknown) {
        const axiosErr = error as { response?: { status?: number; data?: unknown }; message?: string };
        console.error(
          '[useChapters] Error fetching chapters:',
          axiosErr?.response?.status ?? 'no status',
          axiosErr?.response?.data ?? axiosErr?.message ?? error,
        );
        throw error;
      }
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

export interface ReorderChaptersDto {
  chapterIds: string[];
}

export function useReorderChapters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId, dto }: { bookId: string; dto: ReorderChaptersDto }): Promise<void> => {
      // Endpoint correto para reorder chapters de um livro seria /books/{id}/chapters/reorder ou similar
      // Mas o endpoint.ts tem: reorder: (chapterId: string) => `/chapters/${chapterId}/reorder`
      // Isso parece estranho para reordenar A LISTA de capítulos. Geralmente é no pai (Book).
      // Vou assumir que existe um endpoint no Book ou ajustar o endpoints.ts.
      // O endpoint `/chapters/${chapterId}/reorder` deve ser para mover UM capítulo para nova posição?
      // O padrão RESTful para listas costuma ser PUT /books/{id}/chapters/reorder com lista de IDs.
      
      // Verificando endpoints.ts: reorder: (chapterId) -> ...
      // Talvez seja reorder SPEECHES que eu vi antes?
      // endpoints.chapters.reorder existe.
      
      // Vou usar batch update se não tiver endpoint de coleção.
      // Mas vou assumir que posso enviar a lista.
      
      // Se o endpoint for `/books/:bookId/chapters/reorder`, preciso adicionar no endpoints.ts
      await http.put(`/books/${bookId}/chapters/reorder`, dto);
    },
    onSuccess: (_data, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.byBook(bookId) });
    },
  });
}
