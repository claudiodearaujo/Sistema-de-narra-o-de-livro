import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, ChevronDown, CheckCircle2, Clock, FileText, GripVertical } from 'lucide-react';
import type { Chapter } from '../../../../shared/types/chapter.types';
import { cn } from '../../../../shared/lib/utils';

interface SortableChapterItemProps {
  chapter: Chapter;
  idx: number; // Índice visual (1-based)
  isActive: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

const STATUS_CONFIG = {
  completed: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-emerald-500', label: 'Completo' },
  in_progress: { icon: <Clock className="w-3 h-3" />, color: 'text-blue-400', label: 'Em andamento' },
  draft: { icon: <FileText className="w-3 h-3" />, color: 'text-zinc-500', label: 'Rascunho' },
};

export function SortableChapterItem({
  chapter,
  idx,
  isActive,
  isExpanded,
  onSelect,
  onToggleExpand,
}: SortableChapterItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const status = STATUS_CONFIG[chapter.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;

  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      {/* Drag Handle (hover only) */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-0 top-3 -translate-x-full pr-1 opacity-0 group-hover/sortable:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3.5 h-3.5 text-zinc-600" />
      </div>

      <div
        className={cn(
          'rounded-lg p-2 cursor-pointer group select-none transition-colors',
          isActive
            ? 'bg-amber-500/10 border border-amber-500/20'
            : 'hover:bg-zinc-800/50 border border-transparent'
        )}
        onClick={() => onSelect(chapter.id)}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(chapter.id);
            }}
            className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 p-0.5 rounded hover:bg-zinc-700/50"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          <span
            className={cn(
              'text-xs font-medium flex-1 truncate',
              isActive ? 'text-zinc-200' : 'text-zinc-400 group-hover:text-zinc-300'
            )}
          >
            Cap. {idx} — {chapter.title}
          </span>

          <span className={cn('shrink-0', status.color)} title={status.label}>
            {status.icon}
          </span>
        </div>

        <div className="mt-1 text-[10px] text-zinc-600 pl-6 flex items-center justify-between">
          <span>
            {chapter.wordCount?.toLocaleString('pt-BR') ?? 0} palavras
            {chapter.speechesCount > 0 && ` · ${chapter.speechesCount} falas`}
          </span>
        </div>
      </div>

      {/* Expanded mini-preview placeholder */}
      {isExpanded && (
        <div className="ml-6 pl-2 border-l border-zinc-800 mt-1 mb-2 space-y-1 animate-in slide-in-from-top-1 duration-200">
          <p className="text-[10px] text-zinc-600 py-1 italic">
            {chapter.speechesCount === 0
              ? 'Nenhuma fala ainda'
              : `${chapter.speechesCount} fala${chapter.speechesCount > 1 ? 's' : ''} — clique para carregar`}
          </p>
        </div>
      )}
    </div>
  );
}
