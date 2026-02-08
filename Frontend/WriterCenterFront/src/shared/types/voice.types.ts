export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  description?: string;
  previewUrl?: string;
}

export interface VoicePreviewDto {
  voiceId: string;
  text: string;
}

export interface NarrationJob {
  id: string;
  chapterId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalSpeeches: number;
  processedSpeeches: number;
  audioUrl?: string;
  duration?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NarrationProgress {
  jobId: string;
  chapterId: string;
  currentIndex: number;
  totalSpeeches: number;
  percentage: number;
}
