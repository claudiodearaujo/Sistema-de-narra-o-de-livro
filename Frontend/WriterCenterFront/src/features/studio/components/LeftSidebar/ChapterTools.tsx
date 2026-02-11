import { Music, Mic, Wand2, Download, Loader2 } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';

interface ChapterToolsProps {
  chapterId: string;
  onNarrate: () => void;
  onExport: () => void;
  isNarrating?: boolean;
  narrationProgress?: number;
}

export function ChapterTools({
  chapterId: _chapterId,
  onNarrate,
  onExport,
  isNarrating,
  narrationProgress = 0,
}: ChapterToolsProps) {
  return (
    <div className="border-t border-zinc-800 pt-3 mt-3">
      <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2 px-1">Ferramentas do capítulo</p>

      {/* Narration Progress Bar */}
      {isNarrating && narrationProgress > 0 && (
        <div className="px-1 mb-2">
          <div className="flex items-center justify-between text-[10px] text-amber-400 mb-1">
            <span>Narrando...</span>
            <span>{narrationProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${narrationProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1">
        <button
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Trilha sonora do capítulo"
        >
          <Music className="w-3.5 h-3.5" />
          <span>Trilha</span>
        </button>

        <button
          onClick={onNarrate}
          disabled={isNarrating}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors',
            isNarrating
              ? 'text-amber-400 bg-amber-500/10 cursor-not-allowed'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          )}
          title="Narrar capítulo completo"
        >
          {isNarrating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}
          <span>{isNarrating ? 'Narrando...' : 'Narrar'}</span>
        </button>

        <button
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Ferramentas IA para o capítulo"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>IA</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Exportar áudio do capítulo"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar</span>
        </button>
      </div>
    </div>
  );
}

