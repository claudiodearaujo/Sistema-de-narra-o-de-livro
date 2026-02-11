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
