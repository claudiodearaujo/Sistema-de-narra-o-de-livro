export type CharacterRole = 'narrator' | 'protagonist' | 'supporting' | 'antagonist';

export interface Character {
  id: string;
  bookId: string;
  name: string;
  role: CharacterRole;
  color: string;
  avatar: string;
  voiceId: string;
  voiceName?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCharacterDto {
  bookId: string;
  name: string;
  role: CharacterRole;
  color: string;
  voiceId: string;
  description?: string;
}

export interface UpdateCharacterDto {
  name?: string;
  role?: CharacterRole;
  color?: string;
  voiceId?: string;
  description?: string;
}
