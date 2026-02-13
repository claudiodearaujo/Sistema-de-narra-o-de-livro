import { Character } from './character.model';

export interface Speech {
    id: string;
    chapterId: string;
    characterId: string;
    text: string;
    ssmlText?: string;
    orderIndex: number;
    audioUrl?: string;
    sceneImageUrl?: string;
    ambientAudioUrl?: string;
    audioDurationMs?: number;
    startTimeMs?: number;
    endTimeMs?: number;
    character?: Character;
    // Computed fields from backend transform
    order?: number;
    hasAudio?: boolean;
    hasImage?: boolean;
    hasAmbientAudio?: boolean;
    tags?: string[];
}
