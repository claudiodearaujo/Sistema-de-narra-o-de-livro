export interface Book {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'published';
  authorId: string;
  wordCount: number;
  chaptersCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface BookStats {
  totalWords: number;
  totalChapters: number;
  completedChapters: number;
  totalSpeeches: number;
  totalCharacters: number;
  estimatedDuration?: number;
}

export interface CreateBookDto {
  title: string;
  description?: string;
}

export interface UpdateBookDto {
  title?: string;
  description?: string;
  status?: Book['status'];
}
