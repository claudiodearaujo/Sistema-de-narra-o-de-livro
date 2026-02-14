import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../api/http';
import { endpoints } from '../api/endpoints';
import type { Book, CreateBookDto, UpdateBookDto, BooksResponse } from '../types/book.types';

export const bookKeys = {
  all: ['books'] as const,
  byId: (id: string) => ['book', id] as const,
};

export function useBooks() {
  return useQuery({
    queryKey: bookKeys.all,
    queryFn: async (): Promise<BooksResponse> => {
      const { data } = await http.get(endpoints.books.list);
      return data;
    },
    staleTime: 60_000,
  });
}

export function useBook(id: string | null) {
  return useQuery({
    queryKey: bookKeys.byId(id ?? ''),
    queryFn: async (): Promise<Book> => {
      const { data } = await http.get(endpoints.books.byId(id!));
      return data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateBookDto): Promise<Book> => {
      const { data } = await http.post(endpoints.books.list, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateBookDto }): Promise<Book> => {
      const { data } = await http.put(endpoints.books.byId(id), dto);
      return data;
    },
    onSuccess: (book) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
      queryClient.setQueryData(bookKeys.byId(book.id), book);
    },
  });
}
