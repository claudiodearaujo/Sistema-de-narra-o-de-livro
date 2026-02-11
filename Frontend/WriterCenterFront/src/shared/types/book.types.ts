export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  chapters?: { id: string; status: string }[];
}

export interface BookStats {
  totalChapters: number;
  totalSpeeches: number;
  totalCharacters: number;
}

export interface CreateBookDto {
  title: string;
  author: string;
  description?: string;
}

export interface UpdateBookDto {
  title?: string;
  author?: string;
  description?: string;
}

export interface BooksResponse {
  data: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
