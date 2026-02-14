export type TagType = 'pause' | 'emphasis' | 'pitch' | 'rate' | 'volume' | 'whisper';

export interface SpeechTag {
  type: TagType;
  position?: number;
  start?: number;
  end?: number;
  duration?: string;
  level?: 'none' | 'reduced' | 'moderate' | 'strong';
  value?: string;
}

export interface Speech {
  id: string;
  chapterId: string;
  characterId: string;
  order: number;
  text: string;
  emotion?: string;
  tags: SpeechTag[];
  hasAudio: boolean;
  hasImage: boolean;
  hasAmbientAudio: boolean;
  audioUrl?: string;
  sceneImageUrl?: string;
  ambientAudioUrl?: string;
  createdAt: string;
  updatedAt: string;
  character?: {
    id: string;
    name: string;
    voiceId: string;
  };
}

export interface CreateSpeechDto {
  characterId: string;
  text: string;
  order?: number;
  emotion?: string;
  tags?: SpeechTag[];
}

export interface UpdateSpeechDto {
  text?: string;
  characterId?: string;
  emotion?: string;
  tags?: SpeechTag[];
  order?: number;
}

export interface ReorderSpeechesDto {
  speechIds: string[];
}

export interface BulkCreateSpeechDto {
  chapterId: string;
  speeches: Array<{
    characterId: string;
    text: string;
    emotion?: string;
  }>;
}

export interface BatchUpdateSpeechesDto {
  updates: Array<{
    id: string;
    data: UpdateSpeechDto;
  }>;
}
