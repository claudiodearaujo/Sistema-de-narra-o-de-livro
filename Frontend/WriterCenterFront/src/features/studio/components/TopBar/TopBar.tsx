import {
  BookOpen, Save, ChevronLeft, Maximize2, Minimize2, Settings,
  PanelLeftClose, PanelLeftOpen, Undo2, Redo2, Download, Bot,
  Loader2, Check, Sparkles, Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudioStore, useUIStore } from '../../../../shared/stores';
import { useBook } from '../../../../shared/hooks/useBooks';
import { useChapter } from '../../../../shared/hooks/useChapters';
import { cn } from '../../../../shared/lib/utils';

export function TopBar() {
  const navigate = useNavigate();

  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);
  const focusMode = useUIStore((s) => s.focusMode);
  const leftSidebarOpen = useUIStore((s) => s.leftSidebarOpen);
  const toggleLeftSidebar = useUIStore((s) => s.toggleLeftSidebar);
  const openRightPanel = useUIStore((s) => s.openRightPanel);
  const selectedSpeechIds = useUIStore((s) => s.selectedSpeechIds);
  const clearSelection = useUIStore((s) => s.clearSelection);

  const activeBookId = useStudioStore((s) => s.activeBookId);
  const activeChapterId = useStudioStore((s) => s.activeChapterId);
  const isDirty = useStudioStore((s) => s.isDirty);
  const lastSavedAt = useStudioStore((s) => s.lastSavedAt);

  const { data: book } = useBook(activeBookId);
  const { data: chapter } = useChapter(activeChapterId);

  const hasSelection = selectedSpeechIds.length > 0;

  return (
    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 gap-3">
      {/* Left: Back + Sidebar toggle + Book/Chapter info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
          title="Voltar para seleção de livros"
        >
          <ChevronLeft className="w-5 h-5" />
          <BookOpen className="w-4 h-4" />
        </button>

        <button
          onClick={toggleLeftSidebar}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
          title={leftSidebarOpen ? 'Ocultar painel lateral' : 'Mostrar painel lateral'}
        >
          {leftSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>

        <div className="h-5 w-px bg-zinc-700 shrink-0" />

        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-zinc-200 truncate">
            {book?.title ?? 'Carregando...'}
          </h1>
          {chapter && (
            <p className="text-xs text-zinc-500 truncate">{chapter.title}</p>
          )}
        </div>
      </div>

      {/* Center: Selection toolbar OR Undo/Redo */}
      <div className="flex items-center gap-1">
        {hasSelection ? (
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg px-2 py-1">
            <span className="text-xs text-zinc-400 mr-1">{selectedSpeechIds.length} selecionadas</span>
            <button
              className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
              title="Ferramentas IA nas falas selecionadas"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
              title="Excluir falas selecionadas"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={clearSelection}
              className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
              title="Limpar seleção"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <button
              className="p-1.5 text-zinc-600 transition-colors cursor-not-allowed"
              title="Desfazer (em breve)"
              disabled
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 text-zinc-600 transition-colors cursor-not-allowed"
              title="Refazer (em breve)"
              disabled
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Right: Save indicator + actions */}
      <div className="flex items-center gap-1 shrink-0">
        <div
          className={cn(
            'px-2.5 py-1 text-xs flex items-center gap-1.5 rounded',
            isDirty ? 'text-amber-400' : 'text-zinc-500'
          )}
          title={lastSavedAt ? `Último salvamento: ${lastSavedAt.toLocaleTimeString('pt-BR')}` : ''}
        >
          {isDirty ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Save className="w-3 h-3" />
          )}
          <span className="hidden sm:inline">{isDirty ? 'Salvando...' : 'Salvo'}</span>
        </div>

        <div className="h-5 w-px bg-zinc-700" />

        <button
          onClick={() => openRightPanel('ai')}
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          title="Assistente IA"
        >
          <Bot className="w-4 h-4" />
        </button>

        <button
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          title="Exportar áudio"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFocusMode}
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          title={focusMode ? 'Sair do modo foco' : 'Entrar no modo foco'}
        >
          {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          title="Configurações"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
