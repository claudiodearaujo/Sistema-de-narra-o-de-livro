export enum ChapterStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  orderIndex: number;
  status: ChapterStatus;
  soundtrackUrl?: string;
  soundtrackVolume?: number;
  createdAt: Date;
  updatedAt: Date;
  speeches?: any[]; // Will be typed properly in Speeches module
  narration?: any; // Will be typed properly in Narration module
}

export interface CreateChapterDto {
  title: string;
}

export interface UpdateChapterDto {
  title?: string;
}
