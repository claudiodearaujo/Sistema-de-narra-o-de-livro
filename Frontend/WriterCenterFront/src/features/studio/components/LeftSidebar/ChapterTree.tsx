import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
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
import type { Chapter } from '../../../../shared/types/chapter.types';
import { useReorderChapters } from '../../../../shared/hooks/useChapters';
import { SortableChapterItem } from './SortableChapterItem';
import { studioToast } from '../../../../shared/lib/toast';

interface ChapterTreeProps {
  bookId: string;
  chapters: Chapter[];
  activeChapterId: string | null;
  isLoading: boolean;
  onSelectChapter: (chapterId: string) => void;
  onNewChapter: () => void;
}

export function ChapterTree({
  bookId,
  chapters,
  activeChapterId,
  isLoading,
  onSelectChapter,
  onNewChapter,
}: ChapterTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const reorderChapters = useReorderChapters();

  // Local state for optimistic UI updates
  const [localChapters, setLocalChapters] = useState(chapters);

  // Sync local state when prop changes (unless dragging/optimistic pending)
  if (chapters !== localChapters && !reorderChapters.isPending) {
    // Only update if IDs/content changed drastically or initial load
    // Simple check: IDs match?
    const currentIds = localChapters.map(c => c.id).join(',');
    const newIds = chapters.map(c => c.id).join(',');
    if (currentIds !== newIds) {
       setLocalChapters(chapters);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = localChapters.findIndex((c) => c.id === active.id);
    const newIndex = localChapters.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const newOrder = arrayMove(localChapters, oldIndex, newIndex);
    setLocalChapters(newOrder);

    try {
      await reorderChapters.mutateAsync({
        bookId,
        dto: { chapterIds: newOrder.map((c) => c.id) },
      });
    } catch {
      setLocalChapters(chapters); // Revert
      studioToast.error('Erro ao reordenar capítulos');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localChapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {localChapters.map((chapter, idx) => (
            <SortableChapterItem
              key={chapter.id}
              chapter={chapter}
              idx={idx + 1}
              isActive={chapter.id === activeChapterId}
              isExpanded={expandedIds.has(chapter.id)}
              onSelect={onSelectChapter}
              onToggleExpand={toggleExpand}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={onNewChapter}
        className="w-full mt-2 p-2 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-600 text-zinc-500 hover:text-zinc-400 flex items-center justify-center gap-2 text-xs transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Novo Capítulo
      </button>
    </div>
  );
}
