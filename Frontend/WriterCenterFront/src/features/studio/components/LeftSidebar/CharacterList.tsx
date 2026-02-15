import { Plus, Volume2, Loader2, Edit2 } from 'lucide-react';
import type { Character } from '../../../../shared/types/character.types';

const ROLE_LABELS: Record<string, string> = {
  narrator: 'Narrador',
  protagonist: 'Protagonista',
  supporting: 'Coadjuvante',
  antagonist: 'Antagonista',
};

interface CharacterListProps {
  characters: Character[];
  isLoading: boolean;
  onPreviewAudio: (characterId: string) => Promise<void>;
  onOpenWizard: (characterId?: string) => void;
}

export function CharacterList({
  characters,
  isLoading,
  onPreviewAudio,
  onOpenWizard,
}: CharacterListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
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
                onOpenWizard(character.id);
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
        onClick={() => onOpenWizard()}
        className="w-full mt-1 p-2 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-600 text-zinc-500 hover:text-zinc-400 flex items-center justify-center gap-2 text-xs transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Novo personagem
      </button>
    </div>
  );
}
