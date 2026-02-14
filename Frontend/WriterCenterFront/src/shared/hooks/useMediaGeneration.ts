import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '../api/http';
import { endpoints } from '../api/endpoints';
import { toast } from 'sonner';

export interface SceneImageResponse {
  success: boolean;
  imageUrl: string;
  prompt: string;
}

export interface AmbientAudioResponse {
  success: boolean;
  ambientAudioUrl: string;
}

export interface ChapterSoundtrack {
  chapterId: string;
  soundtrackUrl: string | null;
  soundtrackVolume: number;
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
    onError: (error: any) => {
      toast.error('Erro ao gerar imagem: ' + (error.message || 'Erro desconhecido'));
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
     onError: (error: any) => {
      toast.error('Erro ao gerar áudio ambiente: ' + (error.message || 'Erro desconhecido'));
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
