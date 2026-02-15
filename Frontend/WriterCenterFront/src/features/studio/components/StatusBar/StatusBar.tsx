import { FileText, Clock, Mic } from 'lucide-react';
import { useStudioStore } from '../../../../shared/stores';
import { useSpeeches } from '../../../../shared/hooks/useSpeeches';
import { useCharacters } from '../../../../shared/hooks/useCharacters';
import { useChapter } from '../../../../shared/hooks/useChapters';
import { SaveStatus } from './SaveStatus';

function estimateNarrationTime(wordCount: number): string {
  // Average spoken rate: ~130 words per minute
  const minutes = Math.round(wordCount / 130);
  if (minutes < 1) return '< 1 min';
  return `~${minutes} min`;
}

export function StatusBar() {
  const activeChapterId = useStudioStore((s) => s.activeChapterId);
  const activeBookId = useStudioStore((s) => s.activeBookId);
  const isDirty = useStudioStore((s) => s.isDirty);
  const lastSavedAt = useStudioStore((s) => s.lastSavedAt);

  const { data: speeches = [] } = useSpeeches(activeChapterId);
  const { data: characters = [] } = useCharacters(activeBookId);
  const { data: chapter } = useChapter(activeChapterId);

  const wordCount = chapter?.wordCount ?? speeches.reduce((sum, s) => sum + s.text.split(/\s+/).filter(Boolean).length, 0);
  const narratedCount = speeches.filter((s) => s.hasAudio).length;

  return (
    <footer className="h-7 sm:h-8 border-t border-zinc-800 flex items-center justify-between px-2 sm:px-4 text-[10px] sm:text-xs text-zinc-500 overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <FileText className="w-3 h-3" />
          <span>{wordCount.toLocaleString('pt-BR')} palavras</span>
        </div>
        <div className="h-3 w-px bg-zinc-700 hidden sm:block" />
        <div className="flex items-center gap-1.5 hidden sm:flex">
          <Clock className="w-3 h-3" />
          <span>{estimateNarrationTime(wordCount)} de narração</span>
        </div>
        {speeches.length > 0 && (
          <>
            <div className="h-3 w-px bg-zinc-700 hidden sm:block" />
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <Mic className="w-3 h-3" />
              <span>{narratedCount}/{speeches.length} narradas</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <span className="hidden sm:inline">{speeches.length} fala{speeches.length !== 1 ? 's' : ''}</span>
        <div className="h-3 w-px bg-zinc-700 hidden sm:block" />
        <span className="hidden sm:inline">{characters.length} personagen{characters.length !== 1 ? 's' : ''}</span>
        <div className="h-3 w-px bg-zinc-700 hidden sm:block" />
        <SaveStatus isDirty={isDirty} lastSavedAt={lastSavedAt} />
      </div>
    </footer>
  );
}
