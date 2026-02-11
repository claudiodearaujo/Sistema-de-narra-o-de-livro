import { useState } from 'react';
import { Plus, Volume2, Loader2, Edit2 } from 'lucide-react';
import type { Character, CreateCharacterDto, UpdateCharacterDto } from '../../../../shared/types/character.types';
import { CharacterEditorModal } from './CharacterEditorModal';

const ROLE_LABELS: Record<string, string> = {
  narrator: 'Narrador',
  protagonist: 'Protagonista',
  supporting: 'Coadjuvante',
  antagonist: 'Antagonista',
};

interface CharacterListProps {
  characters: Character[];
  isLoading: boolean;
  bookId: string;
  onNewCharacter: (dto: CreateCharacterDto) => Promise<void>;
  onUpdateCharacter: (id: string, dto: UpdateCharacterDto) => Promise<void>;
  onPreviewAudio: (characterId: string) => Promise<void>;
  isSaving?: boolean;
  isPreviewing?: boolean;
}

export function CharacterList({
  characters,
  isLoading,
  bookId,
  onNewCharacter,
  onUpdateCharacter,
  onPreviewAudio,
  isSaving = false,
  isPreviewing = false,
}: CharacterListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  const handleOpenCreate = () => {
    setEditingCharacter(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (character: Character) => {
    setEditingCharacter(character);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingCharacter(null);
  };

  const handleSave = async (dto: CreateCharacterDto | UpdateCharacterDto) => {
    if (editingCharacter) {
      await onUpdateCharacter(editingCharacter.id, dto as UpdateCharacterDto);
    } else {
      await onNewCharacter(dto as CreateCharacterDto);
    }
  };

  const handlePreviewVoice = async (voiceId: string) => {
    // Create a temporary character ID for preview
    await onPreviewAudio(voiceId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {characters.length === 0 && (
          <p className="text-[11px] text-zinc-600 text-center py-4">Nenhum personagem ainda.</p>
        )}

        {characters.map((character) => (
          <div
            key={character.id}
            className="flex items-center gap-2 rounded-lg p-2 hover:bg-zinc-800/50 group cursor-pointer"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: character.color }}
            >
              {character.name[0]?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">{character.name}</p>
              <p className="text-[10px] text-zinc-600">
                {ROLE_LABELS[character.role] ?? character.role}
                {character.voiceName && ` · ${character.voiceName}`}
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit(character);
                }}
                className="p-1 hover:bg-zinc-700 rounded transition-colors"
                aria-label="Editar personagem"
              >
                <Edit2 className="w-3 h-3 text-zinc-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewAudio(character.id);
                }}
                className="p-1 hover:bg-zinc-700 rounded transition-colors"
                aria-label="Preview de voz"
              >
                <Volume2 className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={handleOpenCreate}
          className="w-full mt-1 p-2 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-600 text-zinc-500 hover:text-zinc-400 flex items-center justify-center gap-2 text-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo personagem
        </button>
      </div>

      <CharacterEditorModal
        isOpen={isModalOpen}
        character={editingCharacter}
        bookId={bookId}
        onClose={handleClose}
        onSave={handleSave}
        onPreviewVoice={handlePreviewVoice}
        isSaving={isSaving}
        isPreviewing={isPreviewing}
      />
    </>
  );
}
