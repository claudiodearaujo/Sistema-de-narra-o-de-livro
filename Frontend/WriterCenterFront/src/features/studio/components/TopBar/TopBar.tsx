import { BookOpen, Save, ChevronLeft, Maximize2, Minimize2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../../../shared/stores';

export function TopBar() {
  const navigate = useNavigate();
  const toggleFocusMode = useUIStore((state) => state.toggleFocusMode);
  const focusMode = useUIStore((state) => state.focusMode);

  return (
    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Voltar para seleção de livros"
        >
          <ChevronLeft className="w-5 h-5" />
          <BookOpen className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-zinc-700" />

        <div>
          <h1 className="text-sm font-semibold text-zinc-200">Livro Exemplo</h1>
          <p className="text-xs text-zinc-500">Capítulo 1: A Partida</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5"
          title="Auto-salvamento ativo"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Salvo</span>
        </button>

        <div className="h-6 w-px bg-zinc-700" />

        <button
          onClick={toggleFocusMode}
          className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
          title={focusMode ? 'Sair do modo foco' : 'Entrar no modo foco'}
        >
          {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Configurações"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
