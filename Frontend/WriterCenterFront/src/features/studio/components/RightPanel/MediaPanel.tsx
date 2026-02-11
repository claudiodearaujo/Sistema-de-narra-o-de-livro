import { Music, Mic, Image, Wind, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useStudioStore, useUIStore } from '../../../../shared/stores';
import { http } from '../../../../shared/api/http';
import { endpoints } from '../../../../shared/api/endpoints';

function MediaActionButton({
  icon,
  label,
  description,
  onClick,
  loading,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors text-left group"
    >
      <div className="w-7 h-7 rounded-md bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center shrink-0 transition-colors">
        {loading ? <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" /> : icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-300">{label}</p>
        {description && <p className="text-[10px] text-zinc-600 truncate">{description}</p>}
      </div>
    </button>
  );
}

export function MediaPanel() {
  const activeChapterId = useStudioStore((s) => s.activeChapterId);
  const selectedSpeechIds = useUIStore((s) => s.selectedSpeechIds);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const runAction = async (key: string, fn: () => Promise<unknown>) => {
    setLoadingAction(key);
    try {
      await fn();
    } catch {
      // Error is best-effort for media actions
    } finally {
      setLoadingAction(null);
    }
  };

  const selectedSpeechId = selectedSpeechIds[0] ?? null;

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Chapter media */}
      <div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Mídia do capítulo</p>
        <div className="space-y-1">
          <MediaActionButton
            icon={<Music className="w-3.5 h-3.5 text-purple-400" />}
            label="Trilha sonora"
            description="Adicionar ou alterar trilha de fundo"
            loading={loadingAction === 'soundtrack'}
            disabled={!activeChapterId}
            onClick={() =>
              runAction('soundtrack', () =>
                Promise.resolve() // Placeholder — opens a file picker in a future release
              )
            }
          />
          <MediaActionButton
            icon={<Wind className="w-3.5 h-3.5 text-blue-400" />}
            label="Áudio ambiente"
            description="Sons de fundo para o capítulo"
            loading={loadingAction === 'chapter-ambient'}
            disabled={!activeChapterId}
            onClick={() => runAction('chapter-ambient', () => Promise.resolve())}
          />
        </div>
      </div>

      {/* Speech-level media */}
      <div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
          Fala selecionada
        </p>
        {!selectedSpeechId && (
          <p className="text-[11px] text-zinc-600 px-1 mb-2">
            Selecione uma fala no canvas para gerar mídia individual.
          </p>
        )}
        <div className="space-y-1">
          <MediaActionButton
            icon={<Mic className="w-3.5 h-3.5 text-emerald-400" />}
            label="Gerar narração TTS"
            description={selectedSpeechId ? `Fala ${selectedSpeechId.slice(0, 6)}...` : undefined}
            loading={loadingAction === 'tts'}
            disabled={!selectedSpeechId}
            onClick={() =>
              runAction('tts', () =>
                http.post(endpoints.speeches.audio(selectedSpeechId!), {})
              )
            }
          />
          <MediaActionButton
            icon={<Image className="w-3.5 h-3.5 text-blue-400" />}
            label="Gerar imagem da cena"
            loading={loadingAction === 'scene-image'}
            disabled={!selectedSpeechId}
            onClick={() =>
              runAction('scene-image', () =>
                http.post(endpoints.speeches.sceneImage(selectedSpeechId!), {})
              )
            }
          />
          <MediaActionButton
            icon={<Wind className="w-3.5 h-3.5 text-purple-400" />}
            label="Gerar áudio ambiente"
            loading={loadingAction === 'ambient-audio'}
            disabled={!selectedSpeechId}
            onClick={() =>
              runAction('ambient-audio', () =>
                http.post(endpoints.speeches.ambientAudio(selectedSpeechId!), {})
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
