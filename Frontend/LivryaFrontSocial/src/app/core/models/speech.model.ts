import { Character } from './character.model';

export interface Speech {
    id: string;
    chapterId: string;
    characterId: string;
    text: string;
    ssmlText?: string;
    orderIndex: number;
    audioUrl?: string;
    character?: Character;
}
