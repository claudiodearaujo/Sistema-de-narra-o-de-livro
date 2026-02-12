import { useEffect, useCallback } from 'react';
import { useStudioStore, useUIStore } from '../../../shared/stores';

interface KeyboardShortcutOptions {
  onSaveManual?: () => void;
}

/**
 * Global keyboard shortcuts for the Studio.
 * Shortcuts are only active when the Studio page is mounted.
 *
 * ┌──────────────────┬───────────────────────────────────┐
 * │ Ctrl+S           │ Manual save (prevent default)     │
 * │ Ctrl+Enter       │ Save speech edit (handled by      │
 * │                  │ SpeechBlock, duplicated here for   │
 * │                  │ global consistency)                │
 * │ Esc              │ Exit focus mode / Cancel editing / │
 * │                  │ Clear selection                    │
 * │ Ctrl+Z           │ Undo (future)                     │
 * │ Ctrl+Shift+Z     │ Redo (future)                     │
 * │ Ctrl+B           │ Toggle left sidebar               │
 * │ Ctrl+Shift+A     │ Toggle AI panel                   │
 * │ Ctrl+Shift+F     │ Toggle focus mode                 │
 * └──────────────────┴───────────────────────────────────┘
 */
export function useKeyboardShortcuts(options?: KeyboardShortcutOptions) {
  const toggleLeftSidebar = useUIStore((s) => s.toggleLeftSidebar);
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);
  const focusMode = useUIStore((s) => s.focusMode);
  const setFocusMode = useUIStore((s) => s.setFocusMode);
  const setLeftSidebarOpen = useUIStore((s) => s.setLeftSidebarOpen);
  const openRightPanel = useUIStore((s) => s.openRightPanel);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const closeRightPanel = useUIStore((s) => s.closeRightPanel);
  const clearSelection = useUIStore((s) => s.clearSelection);
  const selectedSpeechIds = useUIStore((s) => s.selectedSpeechIds);

  const editingSpeechId = useStudioStore((s) => s.editingSpeechId);
  const cancelEditing = useStudioStore((s) => s.cancelEditing);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      // Ignore shortcuts when typing in non-studio inputs
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'SELECT';
      const isTextarea = target.tagName === 'TEXTAREA';

      // ── Ctrl+S — Manual save ───────────────────────────────────────
      if (isCtrl && key === 's') {
        e.preventDefault();
        options?.onSaveManual?.();
        return;
      }

      // ── Ctrl+B — Toggle left sidebar ───────────────────────────────
      if (isCtrl && key === 'b' && !isShift && !isInput && !isTextarea) {
        e.preventDefault();
        toggleLeftSidebar();
        return;
      }

      // ── Ctrl+Shift+A — Toggle AI panel ─────────────────────────────
      if (isCtrl && isShift && key === 'a') {
        e.preventDefault();
        if (rightPanelOpen) {
          closeRightPanel();
        } else {
          openRightPanel('ai');
        }
        return;
      }

      // ── Ctrl+Shift+F — Toggle focus mode ───────────────────────────
      if (isCtrl && isShift && key === 'f') {
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      // ── Escape — Exit focus mode / Cancel editing / Clear selection ─
      // Note: Esc for textarea editing is handled inside SpeechBlock/useSpeechEditor
      if (key === 'escape' && !isTextarea) {
        if (focusMode) {
          setFocusMode(false);
          setLeftSidebarOpen(true);
        } else if (editingSpeechId) {
          cancelEditing();
        } else if (selectedSpeechIds.length > 0) {
          clearSelection();
        }
        return;
      }
    },
    [
      toggleLeftSidebar,
      toggleFocusMode,
      focusMode,
      setFocusMode,
      setLeftSidebarOpen,
      openRightPanel,
      closeRightPanel,
      rightPanelOpen,
      clearSelection,
      selectedSpeechIds,
      editingSpeechId,
      cancelEditing,
      options,
    ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
