import { useState, useEffect } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useStudioStore, useUIStore } from '../../../../shared/stores';
import { useSpeeches, useCreateSpeech, useReorderSpeeches } from '../../../../shared/hooks/useSpeeches';
import { useCharacters } from '../../../../shared/hooks/useCharacters';
import { useNarrationContext } from '../../context/NarrationContext';
import { useSpeechEditor } from '../../hooks/useSpeechEditor';
import { useAutoSave } from '../../hooks/useAutoSave';
import { SortableSpeechBlock } from './SortableSpeechBlock';
import { NewSpeechInput } from './NewSpeechInput';
import { studioToast } from '../../../../shared/lib/toast';
import type { CreateSpeechDto } from '../../../../shared/types/speech.types';

export function Canvas() {
  const activeChapterId = useStudioStore((s) => s.activeChapterId);
  const activeBookId = useStudioStore((s) => s.activeBookId);
  const selectedSpeechIds = useUIStore((s) => s.selectedSpeechIds);
  const toggleSpeechSelection = useUIStore((s) => s.toggleSpeechSelection);

  const { data: speeches, isLoading, isError } = useSpeeches(activeChapterId);
  const { data: characters = [] } = useCharacters(activeBookId);

  // Real-time Narration Hook (shared via context)
  const narration = useNarrationContext();

  const editor = useSpeechEditor();
  
  // Enable auto-save for editing sessions
  useAutoSave();

  const createSpeech = useCreateSpeech();
  const reorderSpeeches = useReorderSpeeches();

  // Local state for optimistic UI updates during drag
  const [localSpeeches, setLocalSpeeches] = useState(speeches ?? []);

  // Sync local state with server state when it changes
  useEffect(() => {
    if (speeches) {
      setLocalSpeeches(speeches);
    }
  }, [speeches]);

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !activeChapterId) return;

    const oldIndex = localSpeeches.findIndex((s) => s.id === active.id);
    const newIndex = localSpeeches.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const newOrder = arrayMove(localSpeeches, oldIndex, newIndex);
    setLocalSpeeches(newOrder);

    // Persist to backend
    try {
      await reorderSpeeches.mutateAsync({
        chapterId: activeChapterId,
        dto: {
          speechIds: newOrder.map((s) => s.id),
        },
      });
    } catch {
      // Revert on error
      setLocalSpeeches(speeches ?? []);
      studioToast.error('Erro ao reordenar', 'Não foi possível salvar a nova ordem das falas');
    }
  };

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

  const speechIds = localSpeeches.map((s) => s.id);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto p-6 space-y-2 pb-24">
        {localSpeeches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-600 text-sm">Nenhuma fala ainda. Adicione a primeira fala abaixo.</p>
          </div>
        )}

        {narration.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
             <div className="text-red-400 text-xs">
                <span className="font-semibold block mb-0.5">Falha na narração</span>
                {narration.error}
             </div>
             <button 
               onClick={narration.reset}
               className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-300 px-2 py-1 rounded transition-colors"
             >
               Dispensar
             </button>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={speechIds} strategy={verticalListSortingStrategy}>
            {localSpeeches.map((speech) => {
              const character =
                speech.characterId === 'narrator'
                  ? null
                  : (characters.find((c) => c.id === speech.characterId) ?? null);
              
              const narrationProgress = narration.speechProgress.get(speech.id);

              return (
                <SortableSpeechBlock
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
                  narrationProgress={narrationProgress}
                />
              );
            })}
          </SortableContext>
        </DndContext>

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

