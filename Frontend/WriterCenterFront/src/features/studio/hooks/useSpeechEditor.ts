import { useCallback, useEffect } from 'react';
import { useStudioStore } from '../../../shared/stores';
import { useUpdateSpeech } from '../../../shared/hooks/useSpeeches';
import { studioToast } from '../../../shared/lib/toast';
import { visualToSSML, ssmlToVisual } from '../../../shared/lib/ssml';

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
      // Convert any SSML from backend to visual markers for the editor
      startEditingSpeech(speechId, ssmlToVisual(currentText));
    },
    [startEditingSpeech]
  );

  const saveEdit = useCallback(async () => {
    if (!editingSpeechId || !editingText.trim()) return;

    // Convert visual markers back to SSML before sending to backend
    const ssmlText = visualToSSML(editingText);

    await updateSpeech.mutateAsync({
      id: editingSpeechId,
      dto: { text: ssmlText },
    });

    updateLastSavedAt();
    cancelEditing();
    studioToast.speechSaved();
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
