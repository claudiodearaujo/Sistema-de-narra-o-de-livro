import { Music, Mic, Image, Wind, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useStudioStore } from '../../../../shared/stores';
import { useMediaGeneration } from '../../../../shared/hooks/useMediaGeneration';
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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors text-left group ${
        loading ? 'cursor-wait' : ''
      }`}
    >
      <div className="w-7 h-7 rounded-md bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center shrink-0 transition-colors">
        {loading ? <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" /> : icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-zinc-300">{label}</p>
        {description && <p className="text-[10px] text-zinc-600 truncate">{description}</p>}
      </div>
    </button>
  );
}

export function MediaPanel() {
  const activeChapterId = useStudioStore((s) => s.activeChapterId);
  // Assuming editingSpeechId is what defines the "selected" speech for media operations in this context
  const selectedSpeechId = useStudioStore((s) => s.editingSpeechId); 
  const { generateSceneImage, generateAmbientAudio } = useMediaGeneration();
  const [isTTSLoading, setIsTTSLoading] = useState(false);

  const handleGenerateTTS = async () => {
    if (!selectedSpeechId) return;
    setIsTTSLoading(true);
    try {
        await http.post(endpoints.speeches.audio(selectedSpeechId), {});
        // Invalidation usually handled by mutation hook for TTS if it existed
    } finally {
        setIsTTSLoading(false);
    }
  };

  const handleGenerateImage = () => {
    if (!selectedSpeechId) return;
    generateSceneImage.mutate({ speechId: selectedSpeechId });
  };

  const handleGenerateAmbient = () => {
    if (!selectedSpeechId) return;
    generateAmbientAudio.mutate({ speechId: selectedSpeechId });
  };

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
            // TODO: Implement Chapter Soundtrack Hook properly
            loading={false}
            disabled={!activeChapterId}
            onClick={() => {}} 
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
            description={selectedSpeechId ? `Gerar áudio para fala selecionada` : undefined}
            loading={isTTSLoading}
            disabled={!selectedSpeechId}
            onClick={handleGenerateTTS}
          />
          <MediaActionButton
            icon={<Image className="w-3.5 h-3.5 text-blue-400" />}
            label="Gerar imagem da cena"
            loading={generateSceneImage.isPending}
            disabled={!selectedSpeechId}
            onClick={handleGenerateImage}
          />
          <MediaActionButton
            icon={<Wind className="w-3.5 h-3.5 text-purple-400" />}
            label="Gerar áudio ambiente"
            loading={generateAmbientAudio.isPending}
            disabled={!selectedSpeechId}
            onClick={handleGenerateAmbient}
          />
        </div>
      </div>
    </div>
  );
}
