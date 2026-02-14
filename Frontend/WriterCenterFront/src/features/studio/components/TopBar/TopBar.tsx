import {
  BookOpen, Save, ChevronLeft, Maximize2, Minimize2, Settings,
  PanelLeftClose, PanelLeftOpen, Undo2, Redo2, Download, Bot,
  Loader2, Check, Sparkles, Trash2, Wand2, Mic, Image, FileAudio, Printer
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useBatchOperations } from '../../../../shared/hooks/useBatchOperations';
import { useStudioStore, useUIStore } from '../../../../shared/stores';
import { useBook } from '../../../../shared/hooks/useBooks';
import { useChapter } from '../../../../shared/hooks/useChapters';
import { useSpeeches, useDeleteSpeech, useBatchSpeechAudio } from '../../../../shared/hooks/useSpeeches';
import { cn } from '../../../../shared/lib/utils';
import { studioToast } from '../../../../shared/lib/toast';
import { env } from '../../../../shared/lib';
import { getAccessToken } from '../../../../shared/api/http';

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
  const batchSpeechAudio = useBatchSpeechAudio();
  const { generateBatchAudio, generateBatchImages, exportChapterAudio } = useBatchOperations();

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
               onClick={async () => {
                 if (!activeChapterId || selectedSpeechIds.length === 0) return;

                 try {
                   await batchSpeechAudio.mutateAsync({
                     chapterId: activeChapterId,
                     dto: { action: 'generate_audio', speechIds: selectedSpeechIds },
                   });
                   studioToast.success('Geração em massa iniciada', `${selectedSpeechIds.length} falas enviadas para narração.`);
                 } catch {
                   studioToast.error('Falha na geração em massa', 'Não foi possível gerar áudio para a seleção.');
                 }
               }}
              className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700 rounded-full transition-colors"
              title="Gerar áudio para seleção"
            >
              {batchSpeechAudio.isPending ? (
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
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



        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                title="Ferramentas de IA e Batch"
              >
                <Wand2 className="w-4 h-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                align="end" 
                sideOffset={5} 
                className="z-50 min-w-[220px] rounded-md border border-zinc-700 bg-zinc-900 p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100"
              >
                <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Geração em Lote
                </DropdownMenu.Label>
                
                <DropdownMenu.Item 
                  onSelect={() => activeChapterId && generateBatchAudio.mutate({ chapterId: activeChapterId })}
                  className="cursor-pointer rounded px-2 py-2 text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800 outline-none flex items-center gap-2"
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Gerar Áudio (Todas as falas)</span>
                </DropdownMenu.Item>
                
                <DropdownMenu.Item 
                  onSelect={() => activeChapterId && generateBatchImages.mutate({ chapterId: activeChapterId })}
                  className="cursor-pointer rounded px-2 py-2 text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800 outline-none flex items-center gap-2"
                >
                  <Image className="w-3.5 h-3.5 text-blue-500" />
                  <span>Gerar Imagens (Todas as falas)</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 h-px bg-zinc-700" />
                
                 <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Exportação
                </DropdownMenu.Label>

                <DropdownMenu.Item 
                  onSelect={() => activeChapterId && exportChapterAudio.mutate(activeChapterId)}
                  className="cursor-pointer rounded px-2 py-2 text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800 outline-none flex items-center gap-2"
                >
                  <FileAudio className="w-3.5 h-3.5 text-purple-500" />
                  <span>Exportar Áudio (.mp3)</span>
                </DropdownMenu.Item>

                 <DropdownMenu.Item 
                  onSelect={handleExport}
                  className="cursor-pointer rounded px-2 py-2 text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800 outline-none flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Exportar Texto (.txt)</span>
                </DropdownMenu.Item>

                <DropdownMenu.Item 
                  onSelect={async () => {
                    if (!activeChapterId) return;
                    try {
                      studioToast.info('Gerando PDF...', 'Aguarde um momento.');
                      const response = await fetch(`${env.apiUrl}/chapters/${activeChapterId}/export/print`, {
                        headers: {
                          'Authorization': `Bearer ${getAccessToken()}`
                        }
                      });
                      
                      if (!response.ok) throw new Error('Falha ao gerar PDF');
                      
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `capitulo-${activeChapterId}.pdf`; // Name could be better if we had title here easily accessible without prop drilling
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (e) {
                      studioToast.error('Erro na exportação', 'Não foi possível baixar o PDF.');
                      console.error(e);
                    }
                  }}
                  className="cursor-pointer rounded px-2 py-2 text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800 outline-none flex items-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5 text-orange-500" />
                  <span>Imprimir / Salvar PDF</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>

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
