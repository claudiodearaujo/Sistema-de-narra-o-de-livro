/**
 * useWizardAutoSave Hook
 * Handles auto-saving of wizard data with debounce
 */

import { useEffect, useRef, useCallback } from 'react';
import { useCharacterWizardStore } from '../stores/characterWizardStore';
import type { CharacterFormData } from '../types/character-wizard.types';

const AUTO_SAVE_DELAY = 60000; // 1 minute

interface UseWizardAutoSaveProps {
  bookId: string;
  characterId?: string | null;
  onSave?: (data: CharacterFormData) => Promise<any>;
  onError?: (error: Error) => void;
  onSuccess?: (result?: any) => void;
}

export function useWizardAutoSave({
  bookId,
  characterId,
  onSave,
  onError,
  onSuccess,
}: UseWizardAutoSaveProps) {
  const formData = useCharacterWizardStore((s) => s.formData);
  const isDirty = useCharacterWizardStore((s) => s.isDirty);
  const setIsSaving = useCharacterWizardStore((s) => s.setIsSaving);
  const setError = useCharacterWizardStore((s) => s.setError);
  const setLastSavedAt = useCharacterWizardStore((s) => s.setLastSavedAt);
  const setIsDirty = useCharacterWizardStore((s) => s.setIsDirty);
  const setCharacterId = useCharacterWizardStore((s) => s.setCharacterId);


  const isSavingRef = useRef(false);
  const savedCharacterIdRef = useRef(characterId);

  // Update ref when characterId prop changes
  useEffect(() => {
    savedCharacterIdRef.current = characterId;
  }, [characterId]);

  const performSave = useCallback(async () => {
    // Validate basic required fields
    if (!formData.name?.trim() || !bookId || !formData.voiceId) {
      // Don't error on auto-save if basic fields aren't there yet, just skip
      // setError('Preencha os campos obrigatórios (Dados Básicos) antes de salvar');
      return;
    }

    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      let result: any;

      if (onSave) {
        result = await onSave(formData);
      }

      // If creating new character and onSave returns ID, save it to store
      if (!savedCharacterIdRef.current && result?.id) {
        setCharacterId(result.id);
        savedCharacterIdRef.current = result.id;
      }

      setError(null);
      setLastSavedAt(new Date());
      setIsDirty(false);
      onSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar';
      // Silent error for auto-save, just log
      console.error('Auto-save failed:', errorMessage);
      // setError(`Erro ao auto-salvar: ${errorMessage}`);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [formData, bookId, onSave, onError, onSuccess, setIsSaving, setError, setLastSavedAt, setIsDirty, setCharacterId]);

  // Keep latest performSave in a ref to avoid resetting the timer on every render/keystroke
  const performSaveRef = useRef(performSave);
  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  useEffect(() => {
    if (!isDirty) return;

    // Use setInterval to ensure it runs every minute if changes persist (e.g. error)
    // or if the user keeps typing (since we rely on isDirty and the stable ref)
    const timer = setInterval(() => {
      performSaveRef.current();
    }, AUTO_SAVE_DELAY);

    // Cleanup
    return () => {
      clearInterval(timer);
    };
  }, [isDirty]); // Only restart timer if dirty status changes (e.g. saves successfully)



  return {
    isSaving: useCharacterWizardStore((s) => s.isSaving),
    error: useCharacterWizardStore((s) => s.error),
    lastSavedAt: useCharacterWizardStore((s) => s.lastSavedAt),
    performSave,
  };
}
