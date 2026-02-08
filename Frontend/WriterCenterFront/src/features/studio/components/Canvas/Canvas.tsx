import { Plus } from 'lucide-react';

export function Canvas() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* Sample speech block - Narrator */}
        <div className="group relative">
          <div className="px-4 py-3">
            <div className="text-zinc-400 leading-[1.85] text-[15px] italic cursor-text">
              O sol se punha lentamente sobre a cidade de São Paulo, tingindo os arranha-céus de tons alaranjados. 
              Helena observava tudo da janela do seu apartamento no vigésimo andar, com uma xícara de café já fria entre as mãos. 
              Fazia três meses desde a última vez que falara com Rafael.
            </div>
          </div>
        </div>

        {/* Sample speech block - Character */}
        <div className="group relative border-l-3 border-orange-500/20">
          <div className="px-4 py-3 pl-5">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: '#E8845C' }}
              >
                H
              </div>
              <span className="text-sm font-medium" style={{ color: '#E8845C' }}>
                Helena
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 italic">
                determinação
              </span>
            </div>
            <div className="text-zinc-200 leading-[1.8] text-[15px] cursor-text">
              Eu preciso sair daqui. Preciso encontrar respostas antes que seja tarde demais.
            </div>
          </div>
        </div>

        {/* New speech input */}
        <div className="border border-dashed border-zinc-700 hover:border-zinc-600 rounded-lg p-4 transition-colors">
          <button className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-400 text-sm">
            <Plus className="w-4 h-4" />
            <span>Nova fala</span>
          </button>
        </div>

        {/* Placeholder for more content */}
        <div className="h-96"></div>
      </div>
    </div>
  );
}
