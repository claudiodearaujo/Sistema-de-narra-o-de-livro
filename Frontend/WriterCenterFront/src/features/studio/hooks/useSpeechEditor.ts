import { useCallback, useEffect } from 'react';
import { useStudioStore } from '../../../shared/stores';
import { useUpdateSpeech } from '../../../shared/hooks/useSpeeches';

export function useSpeechEditor() {
  const editingSpeechId = useStudioStore((s) => s.editingSpeechId);
  const editingText = useStudioStore((s) => s.editingText);
  const startEditingSpeech = useStudioStore((s) => s.startEditingSpeech);
  const updateEditingText = useStudioStore((s) => s.updateEditingText);
  const cancelEditing = useStudioStore((s) => s.cancelEditing);
  const updateLastSavedAt = useStudioStore((s) => s.updateLastSavedAt);

  const updateSpeech = useUpdateSpeech();

  const startEdit = useCallback(
    (speechId: string, currentText: string) => {
      startEditingSpeech(speechId, currentText);
    },
    [startEditingSpeech]
  );

  const saveEdit = useCallback(async () => {
    if (!editingSpeechId || !editingText.trim()) return;

    await updateSpeech.mutateAsync({
      id: editingSpeechId,
      dto: { text: editingText },
    });

    updateLastSavedAt();
    cancelEditing();
  }, [editingSpeechId, editingText, updateSpeech, updateLastSavedAt, cancelEditing]);

  const cancel = useCallback(() => {
    cancelEditing();
  }, [cancelEditing]);

  // Global keyboard shortcuts when editing
  useEffect(() => {
    if (!editingSpeechId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editingSpeechId, cancel]);

  return {
    editingSpeechId,
    editingText,
    isEditing: !!editingSpeechId,
    isSaving: updateSpeech.isPending,
    startEdit,
    updateEditingText,
    saveEdit,
    cancel,
  };
}
