/**
 * useWizardAutoSave Hook
 * Handles explicit saving of wizard data when changing steps
 */

import { useEffect, useRef, useCallback } from 'react';
import { useCharacterWizardStore } from '../stores/characterWizardStore';
import type { CharacterFormData } from '../types/character-wizard.types';


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
      // Skip save until required fields are available
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
      console.error('Step save failed:', errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [formData, bookId, onSave, onError, onSuccess, setIsSaving, setError, setLastSavedAt, setIsDirty, setCharacterId]);


  return {
    isSaving: useCharacterWizardStore((s) => s.isSaving),
    error: useCharacterWizardStore((s) => s.error),
    lastSavedAt: useCharacterWizardStore((s) => s.lastSavedAt),
    performSave,
  };
}
