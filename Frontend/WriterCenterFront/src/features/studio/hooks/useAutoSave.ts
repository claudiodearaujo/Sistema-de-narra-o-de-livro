import { useEffect } from 'react';
import { useStudioStore } from '../../../shared/stores';
import { useUpdateSpeech } from '../../../shared/hooks/useSpeeches';
import { visualToSSML } from '../../../shared/lib/ssml';

const AUTOSAVE_DELAY = 3000; // 3 seconds

export function useAutoSave() {
  const isDirty = useStudioStore((s) => s.isDirty);
  const editingSpeechId = useStudioStore((s) => s.editingSpeechId);
  const editingText = useStudioStore((s) => s.editingText);
  const updateLastSavedAt = useStudioStore((s) => s.updateLastSavedAt);

  const updateSpeech = useUpdateSpeech();

  useEffect(() => {
    // Only auto-save if dirty and actively editing a speech
    if (!isDirty || !editingSpeechId) return;

    const timer = setTimeout(async () => {
      // Don't save empty text automatically
      if (!editingText.trim()) return;

      try {
        // Convert visual markers to SSML before saving to backend
        const ssmlText = visualToSSML(editingText);

        await updateSpeech.mutateAsync({
          id: editingSpeechId,
          dto: { text: ssmlText }
        });

        // Update store state (sets isDirty = false, lastSavedAt = now)
        updateLastSavedAt();
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Keep isDirty state true if failed
      }
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(timer);
  }, [isDirty, editingSpeechId, editingText, updateSpeech, updateLastSavedAt]);
}
