import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Sparkles, Image as ImageIcon, Music, Volume2 } from 'lucide-react';
import { useStudioStore } from '../../../../shared/stores';
import { useChapter, useUpdateChapter } from '../../../../shared/hooks/useChapters';
import { useSpeech } from '../../../../shared/hooks/useSpeeches';
import { useSSMLSuggestions } from '../../../../shared/hooks/useSSMLSuggestions';
import { useMediaGeneration } from '../../../../shared/hooks/useMediaGeneration';
import type { Chapter } from '../../../../shared/types/chapter.types';
import { cn } from '../../../../shared/lib/utils';
import { toast } from 'sonner';

interface ChapterFormValues {
  title: string;
  status: Chapter['status'];
  notes: string;
}

const STATUS_OPTIONS: { value: Chapter['status']; label: string }[] = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluído' },
];

export function PropertiesPanel() {
  const activeChapterId = useStudioStore((s) => s.activeChapterId);
  const editingSpeechId = useStudioStore((s) => s.editingSpeechId);
  const { data: chapter, isLoading: isLoadingChapter } = useChapter(activeChapterId);
  const { data: speech, isLoading: isLoadingSpeech } = useSpeech(editingSpeechId);
  const updateChapter = useUpdateChapter();
  const { suggestProperties, applySuggestions } = useSSMLSuggestions();
  const { generateSceneImage, generateAmbientAudio } = useMediaGeneration();

  // Chapter Form
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<ChapterFormValues>({
    defaultValues: { title: '', status: 'draft' },
  });

  useEffect(() => {
    if (chapter) {
      reset({ title: chapter.title, status: chapter.status });
    }
  }, [chapter, reset]);

  const onChapterSubmit = async (values: ChapterFormValues) => {
    if (!activeChapterId) return;
    await updateChapter.mutateAsync({
      id: activeChapterId,
      dto: { title: values.title, status: values.status },
    });
  };

  // SSML & Media Handlers
  const handleSuggestProperties = async () => {
    if (!speech) return;
    try {
      const result = await suggestProperties.mutateAsync({
        text: speech.text,
        characterName: speech.character?.name,
        // emotion: speech.emotion // if available
      });
      
      if (result.properties.length > 0) {
        // Automatically apply top suggestions for demo purposes
        // In a real UI, we'd confirm with user
        const propsToApply: Record<string, string> = {};
        result.properties.forEach(p => {
            if (p.confidence > 0.7) propsToApply[p.property] = p.value;
        });

        if (Object.keys(propsToApply).length > 0) {
            await applySuggestions.mutateAsync({
                text: speech.text,
                properties: propsToApply
            });
            toast.success('Propriedades SSML aplicadas!');
        } else {
            toast.info('Nenhuma sugestão com alta confiança encontrada.');
        }

      }
    } catch (error) {
       // Error handled by mutation
    }
  };

  const handleGenerateImage = async () => {
    if (!speech) return;
    await generateSceneImage.mutateAsync({ 
        speechId: speech.id,
        style: 'cinematic'
    });
  };

  const handleGenerateAmbient = async () => {
    if (!speech) return;
    await generateAmbientAudio.mutateAsync({
        speechId: speech.id,
        ambientType: 'nature'
    });
  };

  if (!activeChapterId) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-zinc-600">Selecione um capítulo para ver as propriedades.</p>
      </div>
    );
  }

  if (isLoadingChapter) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
      </div>
    );
  }

  // If editing a speech, show Speech Properties
  if (editingSpeechId) {
    if (isLoadingSpeech) return <div className="p-4"><Loader2 className="w-4 h-4 animate-spin text-zinc-500"/></div>;
    
    return (
      <div className="p-4 space-y-6">
        <div className="border-b border-zinc-800 pb-2">
            <h3 className="text-sm font-semibold text-zinc-200">Propriedades da Fala</h3>
            <p className="text-xs text-zinc-500 truncate">{speech?.id}</p>
        </div>

        {/* SSML Assistant */}
        <div className="space-y-3">
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Assistente SSML</h4>
            <button
                onClick={handleSuggestProperties}
                disabled={suggestProperties.isPending}
                 className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-600/30 rounded py-2 text-xs transition-colors"
            >
                {suggestProperties.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Sugerir Propriedades (Pitch/Rate)
            </button>
             <p className="text-[10px] text-zinc-600 mt-1">Analisa o texto e sugere ajustes de tom e velocidade.</p>
        </div>

        {/* Media Generation */}
        <div className="space-y-3">
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Mídia da Cena</h4>
            
            {/* Scene Image */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300 flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Imagem</span>
                     <button 
                        onClick={handleGenerateImage}
                        disabled={generateSceneImage.isPending}
                        className="text-xs text-amber-500 hover:text-amber-400 disabled:opacity-50"
                     >
                        {generateSceneImage.isPending ? 'Gerando...' : 'Gerar'}
                     </button>
                </div>
                {speech?.sceneImageUrl ? (
                    <img src={speech.sceneImageUrl} alt="Cena" className="w-full h-24 object-cover rounded border border-zinc-700" />
                ) : (
                    <div className="w-full h-24 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center text-xs text-zinc-600">
                        Nenhuma imagem
                    </div>
                )}
            </div>

            {/* Ambient Audio */}
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300 flex items-center gap-1"><Volume2 className="w-3 h-3"/> Ambiente</span>
                     <button 
                         onClick={handleGenerateAmbient}
                         disabled={generateAmbientAudio.isPending}
                         className="text-xs text-amber-500 hover:text-amber-400 disabled:opacity-50"
                     >
                        {generateAmbientAudio.isPending ? 'Gerando...' : 'Gerar'}
                     </button>
                </div>
                 {speech?.ambientAudioUrl ? (
                    <div className="bg-zinc-900 p-2 rounded border border-zinc-800 flex items-center gap-2">
                        <Music className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs text-zinc-400 truncate flex-1">audio_ambiente.mp3</span>
                    </div>
                ) : (
                    <div className="w-full p-2 bg-zinc-900 rounded border border-zinc-800 text-xs text-zinc-600 text-center">
                        Nenhum áudio ambiente
                    </div>
                )}
            </div>
        </div>

         <div className="border-t border-zinc-800 pt-4">
            <button 
                onClick={() => useStudioStore.getState().cancelEditing()}
                className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
            >
                Voltar para Propriedades do Capítulo
            </button>
        </div>
      </div>
    );
  }

  // Chapter Properties Form
  return (
    <form onSubmit={handleSubmit(onChapterSubmit)} className="p-4 space-y-4">
      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Título do capítulo</label>
        <input
          {...register('title', { required: true })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Status</label>
        <select
          {...register('status')}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={!isDirty || updateChapter.isPending}
        className={cn(
          'w-full py-2 rounded-md text-sm font-medium transition-colors',
          isDirty && !updateChapter.isPending
            ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
        )}
      >
        {updateChapter.isPending ? 'Salvando...' : isDirty ? 'Salvar alterações' : 'Sem alterações'}
      </button>
    </form>
  );
}
