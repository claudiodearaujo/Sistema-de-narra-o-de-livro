import {
  BookOpen, Save, ChevronLeft, Maximize2, Minimize2, Settings,
  PanelLeftClose, PanelLeftOpen, Undo2, Redo2, Download, Bot,
  Loader2, Check, Sparkles, Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudioStore, useUIStore } from '../../../../shared/stores';
import { useBook } from '../../../../shared/hooks/useBooks';
import { useChapter } from '../../../../shared/hooks/useChapters';
import { useSpeeches, useDeleteSpeech } from '../../../../shared/hooks/useSpeeches';
import { cn } from '../../../../shared/lib/utils';
import { studioToast } from '../../../../shared/lib/toast';

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
  const { data: speeches } = useSpeeches(activeChapterId);
  const deleteSpeech = useDeleteSpeech();

  const hasSelection = selectedSpeechIds.length > 0;

  const handleExport = () => {
    if (!speeches || speeches.length === 0) {
      studioToast.error('Nada para exportar', 'O capítulo está vazio.');
      return;
    }

    const content = speeches
      .map(s => {
        const charName = s.characterId === 'narrator' ? 'Narrador' : 'Personagem'; 
        // Idealmente pegariamos o nome do personagem real aqui, mas precisaria cruzar dados
        return `[${charName}]: ${s.text}`;
      })
      .join('\n\n');

    // eslint-disable-next-line no-undef
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chapter?.title || 'capitulo'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    studioToast.success('Exportado com sucesso', 'O arquivo .txt foi baixado.');
  };

  const handleNotImplemented = (feature: string) => {
    studioToast.info('Em breve', `A funcionalidade de ${feature} estará disponível na próxima atualização.`);
  };

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
      <div className="flex-1 flex justify-center">
        {hasSelection ? (
          <div className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-1.5 border border-zinc-700 animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="text-xs font-medium text-zinc-300 mr-2">
              {selectedSpeechIds.length} selecionada{selectedSpeechIds.length > 1 ? 's' : ''}
            </span>
            
            <div className="h-4 w-px bg-zinc-600" />
            
            <button
              onClick={() => openRightPanel('ai')}
              className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-700 rounded-full transition-colors"
              title="Assistente IA (Contexto da seleção)"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            
            <button
               onClick={() => {
                 // TODO: Implementar geração em massa
                 openRightPanel('media');
               }}
              className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700 rounded-full transition-colors"
              title="Gerar áudio para seleção"
            >
              <Loader2 className="w-4 h-4 text-emerald-500 hidden" /> {/* Placeholder para loading */}
              <Bot className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-zinc-600" />

            <button
              onClick={async () => {
                if (window.confirm(`Excluir ${selectedSpeechIds.length} falas selecionadas?`)) {
                   // Deletar uma por uma por enquanto (ideal: endpoint bulk delete)
                   // Como useDeleteSpeech requer {id, chapterId}, e talvez não tenhamos chapterId fácil para todas se pegarmos só IDs...
                   // Mas activeChapterId está aqui.
                   if (!activeChapterId) return;
                   
                   try {
                     await Promise.all(selectedSpeechIds.map(id => 
                       deleteSpeech.mutateAsync({ id, chapterId: activeChapterId })
                     ));
                     clearSelection();
                   } catch (e) {
                     console.error(e);
                   }
                }
              }}
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-full transition-colors"
              title="Excluir selecionadas"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={clearSelection}
              className="ml-2 p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded-full transition-colors"
              title="Limpar seleção"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1 opacity-50">
            <button
              onClick={() => handleNotImplemented('Desfazer')}
              className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
              title="Desfazer"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNotImplemented('Refazer')}
              className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
              title="Refazer"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
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
          onClick={handleExport}
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          title="Exportar capítulo (TXT)"
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
          onClick={() => handleNotImplemented('Configurações')}
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          title="Configurações"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
