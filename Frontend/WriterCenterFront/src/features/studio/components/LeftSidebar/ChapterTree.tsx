import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Loader2, CheckCircle2, Clock, FileText } from 'lucide-react';
import type { Chapter } from '../../../../shared/types/chapter.types';
import { cn } from '../../../../shared/lib/utils';

interface ChapterTreeProps {
  bookId: string;
  chapters: Chapter[];
  activeChapterId: string | null;
  isLoading: boolean;
  onSelectChapter: (chapterId: string) => void;
  onNewChapter: () => void;
}

const STATUS_CONFIG = {
  completed: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-emerald-500', label: 'Completo' },
  in_progress: { icon: <Clock className="w-3 h-3" />, color: 'text-blue-400', label: 'Em andamento' },
  draft: { icon: <FileText className="w-3 h-3" />, color: 'text-zinc-500', label: 'Rascunho' },
};

export function ChapterTree({
  chapters,
  activeChapterId,
  isLoading,
  onSelectChapter,
  onNewChapter,
}: ChapterTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
      {chapters.map((chapter, idx) => {
        const isActive = chapter.id === activeChapterId;
        const isExpanded = expandedIds.has(chapter.id);
        const status = STATUS_CONFIG[chapter.status];

        return (
          <div key={chapter.id}>
            <div
              className={cn(
                'rounded-lg p-2 cursor-pointer group',
                isActive
                  ? 'bg-amber-500/10 border border-amber-500/20'
                  : 'hover:bg-zinc-800/50 border border-transparent'
              )}
              onClick={() => onSelectChapter(chapter.id)}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(chapter.id);
                  }}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
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
                  Cap. {idx + 1} — {chapter.title}
                </span>

                <span className={cn('shrink-0', status.color)} title={status.label}>
                  {status.icon}
                </span>
              </div>

              <div className="mt-1 text-[10px] text-zinc-600 pl-5">
                {chapter.wordCount.toLocaleString('pt-BR')} palavras
                {chapter.speechesCount > 0 && ` · ${chapter.speechesCount} falas`}
              </div>
            </div>

            {/* Expanded mini-preview placeholder */}
            {isExpanded && (
              <div className="ml-5 pl-2 border-l border-zinc-800 mt-1 mb-1 space-y-1">
                <p className="text-[10px] text-zinc-600 py-1">
                  {chapter.speechesCount === 0
                    ? 'Nenhuma fala'
                    : `${chapter.speechesCount} fala${chapter.speechesCount > 1 ? 's' : ''} — clique para abrir`}
                </p>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={onNewChapter}
        className="w-full mt-1 p-2 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-600 text-zinc-500 hover:text-zinc-400 flex items-center justify-center gap-2 text-xs transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Novo Capítulo
      </button>
    </div>
  );
}
