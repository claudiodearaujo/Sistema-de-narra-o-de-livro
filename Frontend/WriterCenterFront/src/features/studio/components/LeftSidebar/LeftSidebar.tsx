import { ChevronRight, ChevronDown, Plus, FileText, Users, BarChart3 } from 'lucide-react';

export function LeftSidebar() {
  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button className="flex-1 px-3 py-2 text-xs font-medium text-amber-400 border-b-2 border-amber-500">
          <FileText className="w-3.5 h-3.5 mx-auto mb-1" />
          Capítulos
        </button>
        <button className="flex-1 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-300">
          <Users className="w-3.5 h-3.5 mx-auto mb-1" />
          Personagens
        </button>
        <button className="flex-1 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-300">
          <BarChart3 className="w-3.5 h-3.5 mx-auto mb-1" />
          Estatísticas
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        <div className="space-y-1">
          {/* Chapter item */}
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-3 h-3 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-200 flex-1">
                Cap. 1 - A Partida
              </span>
              <span className="text-[10px] text-emerald-500">✓</span>
            </div>
            <div className="mt-1 text-[10px] text-zinc-500 pl-5">
              2.840 palavras
            </div>
          </div>

          {/* More chapters */}
          <div className="rounded-lg hover:bg-zinc-800/50 p-2 cursor-pointer">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-zinc-400" />
              <span className="text-xs text-zinc-400 flex-1">
                Cap. 2 - Caminhos Cruzados
              </span>
              <span className="text-[10px] text-blue-500">⚡</span>
            </div>
            <div className="mt-1 text-[10px] text-zinc-600 pl-5">
              1.560 palavras
            </div>
          </div>
        </div>

        {/* Add chapter button */}
        <button className="w-full mt-3 p-2 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-600 text-zinc-500 hover:text-zinc-400 flex items-center justify-center gap-2 text-xs transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Novo Capítulo
        </button>
      </div>
    </div>
  );
}
