import { useState } from 'react';
import { PauseCircle, Zap, TrendingUp, TrendingDown, Wind, Bold, Italic, Sparkles, Loader2, X } from 'lucide-react';
import { useSSMLSuggestions } from '../../../../shared/hooks/useSSMLSuggestions';
import { cn } from '../../../../shared/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';

interface TagToolbarProps {
  onInsertTag: (tag: string) => void;
  selectedText?: string;
}

interface TagButton {
  icon: React.ReactNode;
  label: string;
  tag: string;
  title: string;
}

const TAG_BUTTONS: TagButton[] = [
  {
    icon: <PauseCircle className="w-3.5 h-3.5" />,
    label: 'Pausa',
    tag: '<break time="500ms"/>',
    title: 'Inserir pausa de 500ms',
  },
  {
    icon: <Zap className="w-3.5 h-3.5" />,
    label: 'Ênfase',
    tag: '<emphasis level="moderate"> </emphasis>',
    title: 'Inserir ênfase',
  },
  {
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    label: 'Tom+',
    tag: '<prosody pitch="+2st"> </prosody>',
    title: 'Tom mais alto',
  },
  {
    icon: <TrendingDown className="w-3.5 h-3.5" />,
    label: 'Tom-',
    tag: '<prosody pitch="-2st"> </prosody>',
    title: 'Tom mais baixo',
  },
  {
    icon: <Wind className="w-3.5 h-3.5" />,
    label: 'Sussurro',
    tag: '<amazon:effect name="whispered"> </amazon:effect>',
    title: 'Voz sussurrada',
  },
  {
    icon: <Bold className="w-3.5 h-3.5" />,
    label: 'Forte',
    tag: '<prosody volume="loud"> </prosody>',
    title: 'Volume alto',
  },
  {
    icon: <Italic className="w-3.5 h-3.5" />,
    label: 'Suave',
    tag: '<prosody volume="soft"> </prosody>',
    title: 'Volume suave',
  },
];

export function TagToolbar({ onInsertTag, selectedText = '' }: TagToolbarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [context, setContext] = useState('');
  const [emotion, setEmotion] = useState('');
  const { suggestTags } = useSSMLSuggestions();

  const handleFetchSuggestions = async () => {
     await suggestTags.mutateAsync({
      text: selectedText || 'Texto de exemplo para sugestão', // Fallback
      context,
      emotion
    });
  };

  return (
    <>
      <div className="flex items-center gap-1 px-1 py-1 bg-zinc-900 border border-zinc-700 rounded-md overflow-x-auto">
        {TAG_BUTTONS.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={() => onInsertTag(btn.tag)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors whitespace-nowrap"
            title={btn.title}
          >
            {btn.icon}
            <span className="hidden sm:inline">{btn.label}</span>
          </button>
        ))}

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-amber-500 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors whitespace-nowrap"
          title="Sugestões de tags com IA"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">IA Assist</span>
        </button>
      </div>

      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border border-zinc-700 bg-zinc-900 p-6 shadow-xl focus:outline-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-zinc-100">
                Sugestões SSML com IA
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Texto Selecionado</label>
                <div className="p-2 bg-zinc-800 rounded text-sm text-zinc-300 min-h-[40px] max-h-[100px] overflow-y-auto italic">
                  "{selectedText || 'Nenhum texto selecionado (usando exemplo)'}"
                </div>
              </div>

               <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Emoção</label>
                  <select 
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200"
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value)}
                  >
                    <option value="">Neutro</option>
                    <option value="happy">Alegre</option>
                    <option value="sad">Triste</option>
                    <option value="angry">Bravo</option>
                    <option value="excited">Empolgado</option>
                    <option value="tense">Tenso</option>
                    <option value="whispering">Sussurrando</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Contexto (Opcional)</label>
                  <input 
                    type="text" 
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200"
                    placeholder="Ex: Cena de batalha"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handleFetchSuggestions}
                disabled={suggestTags.isPending}
                 className={cn(
                  "w-full py-2 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors",
                  suggestTags.isPending ? "bg-zinc-800 text-zinc-500" : "bg-amber-600 hover:bg-amber-500 text-white"
                )}
              >
                {suggestTags.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {suggestTags.isPending ? 'Analisando...' : 'Gerar Sugestões'}
              </button>

              {suggestTags.data && (
                <div className="space-y-2 mt-4 max-h-[200px] overflow-y-auto">
                  <label className="text-xs text-zinc-500 uppercase font-bold">Sugestões</label>
                  {suggestTags.data.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="group flex items-start justify-between p-2 rounded bg-zinc-800/50 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all">
                      <div className="flex-1 mr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-black/30 px-1 py-0.5 rounded text-amber-400 font-mono">
                            {suggestion.tag}
                          </code>
                          <span className="text-[10px] uppercase tracking-wider text-zinc-500 border border-zinc-700 px-1 rounded">
                            {suggestion.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">{suggestion.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          onInsertTag(suggestion.tag);
                          setIsDialogOpen(false);
                        }}
                        className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded"
                      >
                        Aplicar
                      </button>
                    </div>
                  ))}
                  {suggestTags.data.suggestions.length === 0 && (
                    <p className="text-sm text-zinc-500 text-center py-2">Nenhuma sugestão encontrada.</p>
                  )}
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
