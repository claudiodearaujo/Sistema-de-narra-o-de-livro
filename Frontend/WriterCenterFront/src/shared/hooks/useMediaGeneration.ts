import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '../api/http';
import { endpoints } from '../api/endpoints';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

export interface SceneImageResponse {
  success: boolean;
  imageUrl: string;
  prompt: string;
}

export interface AmbientAudioResponse {
  success: boolean;
  ambientAudioUrl: string;
  ambientType: string;
  duration: number;
  engine: 'curated_catalog';
}

export interface ChapterSoundtrack {
  chapterId: string;
  soundtrackUrl: string | null;
  soundtrackVolume: number;
}

function getApiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ error?: string; message?: string }>;
  return axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || 'Erro desconhecido';
}

export function useMediaGeneration() {
  const queryClient = useQueryClient();

  const generateSceneImage = useMutation({
    mutationFn: async (params: {
      speechId: string;
      style?: string;
      negativePrompt?: string;
    }) => {
      const { data } = await http.post<SceneImageResponse>(
        endpoints.speeches.sceneImage(params.speechId),
        params
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['speech', variables.speechId] });
      queryClient.invalidateQueries({ queryKey: ['chapter-speeches'] });
      toast.success('Imagem da cena gerada com sucesso!');
    },
    onError: (error: unknown) => {
      toast.error('Erro ao gerar imagem: ' + getApiErrorMessage(error));
    }
  });

  const generateAmbientAudio = useMutation({
    mutationFn: async (params: {
      speechId: string;
      ambientType?: string;
      duration?: number;
    }) => {
      const { data } = await http.post<AmbientAudioResponse>(
        endpoints.speeches.ambientAudio(params.speechId),
        params
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['speech', variables.speechId] });
      queryClient.invalidateQueries({ queryKey: ['chapter-speeches'] });
      toast.success('Áudio ambiente gerado com sucesso!');
    },
    onError: (error: unknown) => {
      toast.error('Erro ao gerar áudio ambiente: ' + getApiErrorMessage(error));
    }
  });

  return {
    generateSceneImage,
    generateAmbientAudio,
  };
}

export function useChapterSoundtrack(chapterId?: string) {
  const queryClient = useQueryClient();

  const soundtrack = useQuery({
    queryKey: ['chapter-soundtrack', chapterId],
    queryFn: async () => {
      if (!chapterId) throw new Error('Chapter ID required');
      const { data } = await http.get<ChapterSoundtrack>(
        endpoints.media.chapterSoundtrack(chapterId)
      );
      return data;
    },
    enabled: !!chapterId,
  });

  const updateSoundtrack = useMutation({
    mutationFn: async (params: {
      soundtrackUrl: string;
      soundtrackVolume?: number;
    }) => {
      if (!chapterId) throw new Error('Chapter ID required');
      const { data } = await http.put<ChapterSoundtrack>(
        endpoints.media.chapterSoundtrack(chapterId),
        params
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter-soundtrack', chapterId] });
      toast.success('Trilha sonora do capítulo atualizada!');
    }
  });

  const generateSuggestion = useMutation({
    mutationFn: async () => {
      if (!chapterId) throw new Error('Chapter ID required');
      const { data } = await http.post<{ suggestion: any }>(
        endpoints.media.generateSoundtrack(chapterId),
        {}
      );
      return data.suggestion;
    },
  });

  return {
    soundtrack,
    updateSoundtrack,
    generateSuggestion,
  };
}
