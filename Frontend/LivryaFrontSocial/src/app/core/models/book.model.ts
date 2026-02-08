import { Chapter } from "./chapter.model";

export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  chapters?: Chapter[];
  // Future: userId for multi-user support
  userId?: string;
}

export interface CreateBookDto {
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
}

export interface UpdateBookDto {
  title?: string;
  author?: string;
  description?: string;
  coverUrl?: string;
}

export interface BookStats {
  totalChapters: number;
  totalSpeeches: number;
  totalCharacters: number;
}

export interface BooksResponse {
  data: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
