export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  order: number;
  status: 'draft' | 'in_progress' | 'completed';
  wordCount: number;
  speechesCount: number;
  soundtrackUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChapterDto {
  bookId: string;
  title: string;
  order?: number;
}

export interface UpdateChapterDto {
  title?: string;
  order?: number;
  status?: Chapter['status'];
  soundtrackUrl?: string;
}

export interface ReorderChaptersDto {
  chapterIds: string[];
}
