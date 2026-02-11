import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../../../shared/api/http';
import { endpoints } from '../../../shared/api/endpoints';
import { studioToast } from '../../../shared/lib/toast';
import { speechKeys } from '../../../shared/hooks/useSpeeches';
import { useUIStore } from '../../../shared/stores';

/**
 * Hook para ações rápidas nas falas (gerar áudio, imagem, ambiente, etc).
 */
export function useSpeechActions() {
  const queryClient = useQueryClient();
  const openRightPanel = useUIStore((s) => s.openRightPanel);
  const setSelectedSpeechIds = useUIStore((s) => s.setSelectedSpeechIds);

  /**
   * Gera o áudio TTS para uma fala específica.
   */
  const generateAudio = useMutation({
    mutationFn: async (speechId: string) => {
      const { data } = await http.post(endpoints.speeches.audio(speechId));
      return data;
    },
    onSuccess: (_, speechId) => {
      studioToast.audioGenerated();
      queryClient.invalidateQueries({ queryKey: speechKeys.byId(speechId) });
      // Invalidate list to update hasAudio flag
      queryClient.invalidateQueries({ queryKey: speechKeys.all });
    },
    onError: () => {
      studioToast.error('Erro ao gerar áudio', 'Não foi possível gerar a narração.');
    },
  });

  /**
   * Gera a imagem da cena baseada no texto da fala.
   */
  const generateSceneImage = useMutation({
    mutationFn: async (speechId: string) => {
      const { data } = await http.post(endpoints.speeches.sceneImage(speechId));
      return data;
    },
    onSuccess: (_, speechId) => {
      studioToast.imageGenerated();
      queryClient.invalidateQueries({ queryKey: speechKeys.byId(speechId) });
      queryClient.invalidateQueries({ queryKey: speechKeys.all });
    },
    onError: () => {
      studioToast.error('Erro ao gerar imagem', 'Não foi possível criar a imagem da cena.');
    },
  });

  /**
   * Gera o áudio ambiente para a cena.
   */
  const generateAmbientAudio = useMutation({
    mutationFn: async (speechId: string) => {
      const { data } = await http.post(endpoints.speeches.ambientAudio(speechId));
      return data;
    },
    onSuccess: (_, speechId) => {
      studioToast.success('Áudio ambiente gerado');
      queryClient.invalidateQueries({ queryKey: speechKeys.byId(speechId) });
      queryClient.invalidateQueries({ queryKey: speechKeys.all });
    },
    onError: () => {
      studioToast.error('Erro ao gerar ambiente');
    },
  });

  /**
   * Abre o painel de IA com o contexto da fala selecionada.
   */
  const openAiTools = (speechId: string) => {
    setSelectedSpeechIds([speechId]);
    openRightPanel('ai');
  };

  return {
    generateAudio,
    generateSceneImage,
    generateAmbientAudio,
    openAiTools,
  };
}
