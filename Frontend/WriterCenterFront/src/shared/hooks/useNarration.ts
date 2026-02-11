import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../api/http';
import { endpoints } from '../api/endpoints';
import {
  connectSocket,
  onSocketEvent,
  type NarrationProgressEvent,
  type NarrationStartedEvent,
  type NarrationCompletedEvent,
  type NarrationFailedEvent,
} from '../api/websocket';
import { speechKeys } from './useSpeeches';
import { chapterKeys } from './useChapters';
import { studioToast } from '../lib/toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export type NarrationStatus = 'idle' | 'connecting' | 'narrating' | 'completed' | 'failed';

export interface SpeechNarrationProgress {
  speechId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  audioUrl?: string;
  error?: string;
}

interface NarrationState {
  status: NarrationStatus;
  chapterId: string | null;
  totalSpeeches: number;
  completedSpeeches: number;
  speechProgress: Map<string, SpeechNarrationProgress>;
  error: string | null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNarration(chapterId: string | null) {
  const queryClient = useQueryClient();
  const unsubscribersRef = useRef<Array<() => void>>([]);

  const [state, setState] = useState<NarrationState>({
    status: 'idle',
    chapterId: null,
    totalSpeeches: 0,
    completedSpeeches: 0,
    speechProgress: new Map(),
    error: null,
  });

  // ── WebSocket Event Handlers ─────────────────────────────────────────────

  const handleStarted = useCallback(
    (event: NarrationStartedEvent) => {
      if (event.chapterId !== chapterId) return;

      setState((prev) => ({
        ...prev,
        status: 'narrating',
        chapterId: event.chapterId,
        totalSpeeches: event.totalSpeeches,
        completedSpeeches: 0,
        speechProgress: new Map(),
        error: null,
      }));

      studioToast.narrationStarted();
    },
    [chapterId]
  );

  const handleProgress = useCallback(
    (event: NarrationProgressEvent) => {
      if (event.chapterId !== chapterId) return;

      setState((prev) => {
        const newProgress = new Map(prev.speechProgress);
        newProgress.set(event.speechId, {
          speechId: event.speechId,
          status: event.status,
          progress: event.progress,
          audioUrl: event.audioUrl,
          error: event.error,
        });

        const completedCount = Array.from(newProgress.values()).filter(
          (p) => p.status === 'completed'
        ).length;

        return {
          ...prev,
          completedSpeeches: completedCount,
          speechProgress: newProgress,
        };
      });

      // Invalidate speech data when an individual speech completes
      if (event.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: speechKeys.byChapter(chapterId!) });
      }
    },
    [chapterId, queryClient]
  );

  const handleCompleted = useCallback(
    (event: NarrationCompletedEvent) => {
      if (event.chapterId !== chapterId) return;

      setState((prev) => ({
        ...prev,
        status: 'completed',
        completedSpeeches: event.totalAudios,
      }));

      studioToast.narrationCompleted();

      // Refresh data after full narration
      queryClient.invalidateQueries({ queryKey: speechKeys.byChapter(chapterId!) });
      queryClient.invalidateQueries({ queryKey: chapterKeys.byId(chapterId!) });
    },
    [chapterId, queryClient]
  );

  const handleFailed = useCallback(
    (event: NarrationFailedEvent) => {
      if (event.chapterId !== chapterId) return;

      setState((prev) => ({
        ...prev,
        status: 'failed',
        error: event.error,
      }));

      studioToast.narrationFailed(event.error);
    },
    [chapterId]
  );

  // ── Subscribe to WebSocket Events ────────────────────────────────────────

  useEffect(() => {
    if (!chapterId) return;

    connectSocket();

    const unsubs = [
      onSocketEvent('narration:started', handleStarted),
      onSocketEvent('narration:progress', handleProgress),
      onSocketEvent('narration:completed', handleCompleted),
      onSocketEvent('narration:failed', handleFailed),
    ];
    unsubscribersRef.current = unsubs;

    return () => {
      unsubs.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, [chapterId, handleStarted, handleProgress, handleCompleted, handleFailed]);

  // ── API Mutations ────────────────────────────────────────────────────────

  const startNarration = useMutation({
    mutationFn: async () => {
      if (!chapterId) throw new Error('No chapter selected');
      setState((prev) => ({ ...prev, status: 'connecting', error: null }));
      const { data } = await http.post(endpoints.chapters.narration.start(chapterId), {});
      return data;
    },
    onError: (error: Error) => {
      setState((prev) => ({
        ...prev,
        status: 'failed',
        error: error.message || 'Erro ao iniciar narração.',
      }));
    },
  });

  const cancelNarration = useMutation({
    mutationFn: async () => {
      if (!chapterId) throw new Error('No chapter selected');
      await http.post(endpoints.chapters.narration.cancel(chapterId), {});
    },
    onSuccess: () => {
      setState({
        status: 'idle',
        chapterId: null,
        totalSpeeches: 0,
        completedSpeeches: 0,
        speechProgress: new Map(),
        error: null,
      });
    },
  });

  // ── Generate Audio for Single Speech ─────────────────────────────────────

  const generateSpeechAudio = useMutation({
    mutationFn: async (speechId: string) => {
      const { data } = await http.post(endpoints.speeches.audio(speechId), {});
      return data;
    },
    onSuccess: () => {
      if (chapterId) {
        queryClient.invalidateQueries({ queryKey: speechKeys.byChapter(chapterId) });
      }
      studioToast.audioGenerated();
    },
  });

  // ── Public API ───────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      chapterId: null,
      totalSpeeches: 0,
      completedSpeeches: 0,
      speechProgress: new Map(),
      error: null,
    });
  }, []);

  const overallProgress = state.totalSpeeches > 0
    ? Math.round((state.completedSpeeches / state.totalSpeeches) * 100)
    : 0;

  return {
    // State
    status: state.status,
    isNarrating: state.status === 'narrating' || state.status === 'connecting',
    isIdle: state.status === 'idle',
    totalSpeeches: state.totalSpeeches,
    completedSpeeches: state.completedSpeeches,
    overallProgress,
    speechProgress: state.speechProgress,
    error: state.error,

    // Actions
    start: startNarration.mutateAsync,
    cancel: cancelNarration.mutateAsync,
    generateSpeechAudio: generateSpeechAudio.mutateAsync,
    reset,

    // Loading states
    isStarting: startNarration.isPending,
    isCancelling: cancelNarration.isPending,
    isGeneratingSpeechAudio: generateSpeechAudio.isPending,
  };
}
