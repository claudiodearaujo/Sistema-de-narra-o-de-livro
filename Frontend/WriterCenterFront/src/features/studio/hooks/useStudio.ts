import { useCallback, useEffect, useRef } from 'react';
import { useStudioStore } from '../../../shared/stores';
import { useBook } from '../../../shared/hooks/useBooks';
import { useChapters } from '../../../shared/hooks/useChapters';
import { useCharacters } from '../../../shared/hooks/useCharacters';
import { useSpeeches } from '../../../shared/hooks/useSpeeches';
import { useNarration } from '../../../shared/hooks/useNarration';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

/**
 * Composite hook that bundles all Studio page state and data,
 * providing a single entry point for the StudioPage component tree.
 */
export function useStudio() {
  const activeBookId = useStudioStore((s) => s.activeBookId);
  const activeChapterId = useStudioStore((s) => s.activeChapterId);
  const isDirty = useStudioStore((s) => s.isDirty);
  const lastSavedAt = useStudioStore((s) => s.lastSavedAt);

  // Data queries
  const bookQuery = useBook(activeBookId);
  const chaptersQuery = useChapters(activeBookId);
  const charactersQuery = useCharacters(activeBookId);
  const speechesQuery = useSpeeches(activeChapterId);

  // Narration
  const narration = useNarration(activeChapterId);

  // ── Auto-save (debounced) ──────────────────────────────────────────────────
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isDirty) return;

    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set a new debounced timer (3 seconds)
    autoSaveTimerRef.current = setTimeout(() => {
      // Auto-save is triggered by editingSpeech flow — the useSpeechEditor
      // hook handles saving via the save button or Ctrl+Enter.
      // This timer is a safety net for future field-level auto-save.
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty]);

  // ── beforeunload guard ─────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but returnValue is required
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  const handleManualSave = useCallback(() => {
    // Manual save is handled via useSpeechEditor
    // This is a placeholder for future global save behavior
    console.debug('[Studio] Manual save triggered');
  }, []);

  useKeyboardShortcuts({ onSaveManual: handleManualSave });

  // ── Computed values ────────────────────────────────────────────────────────

  const speeches = speechesQuery.data ?? [];
  const chapters = chaptersQuery.data ?? [];
  const characters = charactersQuery.data ?? [];

  const wordCount = speeches.reduce(
    (sum, s) => sum + s.text.split(/\s+/).filter(Boolean).length,
    0,
  );

  const narratedCount = speeches.filter((s) => s.hasAudio).length;

  const activeChapter = chapters.find((c) => c.id === activeChapterId) ?? null;

  return {
    // Active IDs
    activeBookId,
    activeChapterId,

    // Data
    book: bookQuery.data ?? null,
    chapters,
    characters,
    speeches,
    activeChapter,

    // Loading states
    isLoadingBook: bookQuery.isLoading,
    isLoadingChapters: chaptersQuery.isLoading,
    isLoadingCharacters: charactersQuery.isLoading,
    isLoadingSpeeches: speechesQuery.isLoading,

    // Errors
    bookError: bookQuery.error,
    chaptersError: chaptersQuery.error,
    speechesError: speechesQuery.error,

    // Computed
    wordCount,
    narratedCount,
    totalSpeeches: speeches.length,
    totalCharacters: characters.length,

    // Save state
    isDirty,
    lastSavedAt,

    // Narration
    narration,
  };
}
