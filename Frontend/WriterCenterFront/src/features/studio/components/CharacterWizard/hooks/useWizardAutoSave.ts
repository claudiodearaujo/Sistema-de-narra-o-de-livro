/**
 * useWizardAutoSave Hook
 * Handles auto-saving of wizard data with debounce
 */

import { useEffect, useRef, useCallback } from 'react';
import { useCharacterWizardStore } from '../stores/characterWizardStore';

const AUTO_SAVE_DELAY = 3000; // 3 seconds

interface UseWizardAutoSaveProps {
  onSave?: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export function useWizardAutoSave({
  onSave,
  onError,
  onSuccess,
}: UseWizardAutoSaveProps = {}) {
  const formData = useCharacterWizardStore((s) => s.formData);
  const isDirty = useCharacterWizardStore((s) => s.isDirty);
  const characterId = useCharacterWizardStore((s) => s.characterId);
  const setIsSaving = useCharacterWizardStore((s) => s.setIsSaving);
  const setError = useCharacterWizardStore((s) => s.setError);
  const setLastSavedAt = useCharacterWizardStore((s) => s.setLastSavedAt);
  const setIsDirty = useCharacterWizardStore((s) => s.setIsDirty);

  const timeoutRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);

  const performSave = useCallback(async () => {
    // Validate basic required fields
    if (!formData.name?.trim() || !formData.bookId || !formData.voiceId) {
      setError('Preencha os campos obrigatórios (Dados Básicos) antes de salvar');
      return;
    }

    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      if (onSave) {
        await onSave(formData);
      }
      setError(null);
      setLastSavedAt(new Date());
      setIsDirty(false);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar';
      setError(`Erro ao auto-salvar: ${errorMessage}`);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [formData, onSave, onError, onSuccess, setIsSaving, setError, setLastSavedAt, setIsDirty]);

  useEffect(() => {
    if (!isDirty) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, AUTO_SAVE_DELAY);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, formData, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving: useCharacterWizardStore((s) => s.isSaving),
    error: useCharacterWizardStore((s) => s.error),
    lastSavedAt: useCharacterWizardStore((s) => s.lastSavedAt),
    performSave,
  };
}
