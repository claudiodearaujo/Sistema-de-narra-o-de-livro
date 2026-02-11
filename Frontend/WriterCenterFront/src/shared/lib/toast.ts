import { toast } from 'sonner';

/**
 * Custom toast utilities for the Studio
 */
export const studioToast = {
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },

  error: (message: string, description?: string) => {
    toast.error(message, { description });
  },

  info: (message: string, description?: string) => {
    toast.info(message, { description });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  // Studio-specific toasts
  speechSaved: () => {
    toast.success('Fala salva', {
      description: 'As alterações foram salvas com sucesso',
    });
  },

  speechDeleted: () => {
    toast.success('Fala excluída', {
      description: 'A fala foi removida do capítulo',
    });
  },

  chapterCreated: (title: string) => {
    toast.success('Capítulo criado', {
      description: `"${title}" foi adicionado ao livro`,
    });
  },

  narrationStarted: () => {
    toast.info('Narração iniciada', {
      description: 'Acompanhe o progresso na barra lateral',
    });
  },

  narrationCompleted: () => {
    toast.success('Narração concluída', {
      description: 'Todos os áudios foram gerados com sucesso',
    });
  },

  narrationFailed: (error?: string) => {
    toast.error('Erro na narração', {
      description: error || 'Ocorreu um erro ao gerar os áudios',
    });
  },

  audioGenerated: () => {
    toast.success('Áudio gerado', {
      description: 'A narração da fala está pronta',
    });
  },

  imageGenerated: () => {
    toast.success('Imagem gerada', {
      description: 'A imagem da cena foi criada',
    });
  },

  copySuccess: () => {
    toast.success('Copiado', {
      description: 'Texto copiado para a área de transferência',
    });
  },

  networkError: () => {
    toast.error('Erro de conexão', {
      description: 'Verifique sua conexão com a internet',
    });
  },
};
