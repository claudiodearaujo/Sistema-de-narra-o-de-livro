import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { SpeechBlock } from './SpeechBlock';
import type { Speech } from '../../../../shared/types/speech.types';
import type { Character } from '../../../../shared/types/character.types';

import type { SpeechNarrationProgress } from '../../../../shared/hooks/useNarration';

interface SortableSpeechBlockProps {
  speech: Speech;
  character: Character | null;
  isEditing: boolean;
  editingText: string;
  isSelected: boolean;
  onStartEdit: (speechId: string, currentText: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onUpdateText: (text: string) => void;
  onToggleSelect: (speechId: string) => void;
  narrationProgress?: SpeechNarrationProgress;
}

export function SortableSpeechBlock(props: SortableSpeechBlockProps) {
  const { speech, isEditing } = props;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: speech.id,
    disabled: isEditing, // Disable drag when editing
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      {/* Drag Handle */}
      {!isEditing && (
        <button
          {...attributes}
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 opacity-0 group-hover/sortable:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-zinc-800 rounded"
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="w-4 h-4 text-zinc-600" />
        </button>
      )}

      <SpeechBlock {...props} />
    </div>
  );
}
