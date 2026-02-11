import { BookOpen, Loader2 } from 'lucide-react';
import { useStudioStore, useUIStore } from '../../../../shared/stores';
import { useSpeeches, useCreateSpeech } from '../../../../shared/hooks/useSpeeches';
import { useCharacters } from '../../../../shared/hooks/useCharacters';
import { useSpeechEditor } from '../../hooks/useSpeechEditor';
import { SpeechBlock } from './SpeechBlock';
import { NewSpeechInput } from './NewSpeechInput';
import type { CreateSpeechDto } from '../../../../shared/types/speech.types';

export function Canvas() {
  const activeChapterId = useStudioStore((s) => s.activeChapterId);
  const activeBookId = useStudioStore((s) => s.activeBookId);
  const selectedSpeechIds = useUIStore((s) => s.selectedSpeechIds);
  const toggleSpeechSelection = useUIStore((s) => s.toggleSpeechSelection);

  const { data: speeches, isLoading, isError } = useSpeeches(activeChapterId);
  const { data: characters = [] } = useCharacters(activeBookId);

  const editor = useSpeechEditor();
  const createSpeech = useCreateSpeech();

  const handleSaveNewSpeech = async (dto: CreateSpeechDto) => {
    await createSpeech.mutateAsync(dto);
  };

  if (!activeChapterId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <BookOpen className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-zinc-500 text-sm">Selecione um capítulo na barra lateral para começar a escrever.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-red-400 text-sm">Erro ao carregar falas. Tente novamente.</p>
      </div>
    );
  }

  const speechList = speeches ?? [];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto p-6 space-y-2 pb-24">
        {speechList.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-600 text-sm">Nenhuma fala ainda. Adicione a primeira fala abaixo.</p>
          </div>
        )}

        {speechList.map((speech) => {
          const character =
            speech.characterId === 'narrator'
              ? null
              : (characters.find((c) => c.id === speech.characterId) ?? null);

          return (
            <SpeechBlock
              key={speech.id}
              speech={speech}
              character={character}
              isEditing={editor.editingSpeechId === speech.id}
              editingText={editor.editingText}
              isSelected={selectedSpeechIds.includes(speech.id)}
              onStartEdit={editor.startEdit}
              onSaveEdit={editor.saveEdit}
              onCancelEdit={editor.cancel}
              onUpdateText={editor.updateEditingText}
              onToggleSelect={toggleSpeechSelection}
            />
          );
        })}

        {/* New speech input */}
        <NewSpeechInput
          chapterId={activeChapterId}
          characters={characters}
          onSave={handleSaveNewSpeech}
          isSaving={createSpeech.isPending}
        />
      </div>
    </div>
  );
}
