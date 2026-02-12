import { useMutation } from '@tanstack/react-query';
import { http } from '../api/http';
import { studioToast } from '../lib/toast';

export function useBatchOperations() {
  const generateBatchAudio = useMutation({
    mutationFn: async ({ chapterId, forceRegenerate }: { chapterId: string, forceRegenerate?: boolean }) => {
      const { data } = await http.post(`/chapters/${chapterId}/batch/generate-audio`, { forceRegenerate });
      return data;
    },
    onSuccess: () => {
      studioToast.success('Geração de áudio iniciada', 'O processo pode levar alguns minutos.');
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || error.message;
      if (error.response?.status === 409) {
          studioToast.info('Já em andamento', 'Uma operação de lote já está sendo processada para este capítulo.');
      } else {
          studioToast.error('Erro ao iniciar geração de áudio', errorMsg);
      }
    }
  });

  const generateBatchImages = useMutation({
    mutationFn: async ({ chapterId, forceRegenerate }: { chapterId: string, forceRegenerate?: boolean }) => {
      const { data } = await http.post(`/chapters/${chapterId}/batch/generate-images`, { forceRegenerate });
      return data;
    },
    onSuccess: () => {
      studioToast.success('Geração de imagens iniciada', 'O processo pode levar alguns minutos.');
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || error.message;
      if (error.response?.status === 409) {
          studioToast.info('Já em andamento', 'Uma operação de lote já está sendo processada para este capítulo.');
      } else {
          studioToast.error('Erro ao iniciar geração de imagens', errorMsg);
      }
    }
  });

  const exportChapterAudio = useMutation({
    mutationFn: async (chapterId: string) => {
      const { data } = await http.post(`/chapters/${chapterId}/export`, {});
      return data;
    },
    onSuccess: () => {
      studioToast.success('Exportação iniciada', 'O áudio unificado será gerado em breve.');
    },
    onError: (error: any) => {
      studioToast.error('Erro ao exportar', error.response?.data?.error || error.message);
    }
  });

  return {
    generateBatchAudio,
    generateBatchImages,
    exportChapterAudio
  };
}
