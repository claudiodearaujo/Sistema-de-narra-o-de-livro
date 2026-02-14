/**
 * useCharacterWizard Hook
 * Main hook for managing character wizard state and validation
 */

import { useCallback, useMemo } from 'react';
import { useCharacterWizardStore } from '../stores/characterWizardStore';
import type { CharacterFormData } from '../types/character-wizard.types';

const TOTAL_STEPS = 7;

const STEP_CONFIG = [
  { id: 1, label: 'Dados Básicos', required: true },
  { id: 2, label: 'Identidade', required: false },
  { id: 3, label: 'Físico', required: false },
  { id: 4, label: 'Rosto', required: false },
  { id: 5, label: 'Olhos', required: false },
  { id: 6, label: 'Cabelo', required: false },
  { id: 7, label: 'Vestuário', required: false },
];

export function useCharacterWizard() {
  const currentStep = useCharacterWizardStore((s) => s.currentStep);
  const formData = useCharacterWizardStore((s) => s.formData);
  const isDirty = useCharacterWizardStore((s) => s.isDirty);
  const isLoading = useCharacterWizardStore((s) => s.isLoading);
  const isSaving = useCharacterWizardStore((s) => s.isSaving);
  const error = useCharacterWizardStore((s) => s.error);
  const completionPercentage = useCharacterWizardStore((s) => s.completionPercentage);
  const lastSavedAt = useCharacterWizardStore((s) => s.lastSavedAt);
  const characterId = useCharacterWizardStore((s) => s.characterId);

  const setCurrentStep = useCharacterWizardStore((s) => s.setCurrentStep);
  const setFormData = useCharacterWizardStore((s) => s.setFormData);
  const updateFormData = useCharacterWizardStore((s) => s.updateFormData);
  const setError = useCharacterWizardStore((s) => s.setError);
  const resetWizard = useCharacterWizardStore((s) => s.resetWizard);
  const loadDraft = useCharacterWizardStore((s) => s.loadDraft);

  /**
   * Validate if step 1 (basic fields) is complete
   */
  const isBasicStepValid = useCallback((): boolean => {
    return !!(
      formData.name?.trim() &&
      formData.name.trim().length >= 2 &&
      formData.bookId?.trim() &&
      formData.voiceId?.trim()
    );
  }, [formData]);

  /**
   * Validate if current step is complete
   */
  const isCurrentStepValid = useCallback((): boolean => {
    if (currentStep === 1) {
      return isBasicStepValid();
    }
    // Other steps don't have required fields, so always valid
    return true;
  }, [currentStep, isBasicStepValid]);

  /**
   * Move to next step with validation
   */
  const goToNextStep = useCallback((): boolean => {
    if (!isCurrentStepValid()) {
      setError('Preencha os campos obrigatórios desta etapa');
      return false;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      return true;
    }

    return false;
  }, [currentStep, isCurrentStepValid, setCurrentStep, setError]);

  /**
   * Move to previous step
   */
  const goToPreviousStep = useCallback((): boolean => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      return true;
    }
    return false;
  }, [currentStep, setCurrentStep]);

  /**
   * Jump to specific step
   */
  const goToStep = useCallback(
    (step: number): boolean => {
      if (step < 1 || step > TOTAL_STEPS) {
        return false;
      }

      // If going back to step 1 or forward through validated steps
      if (step === 1 || step <= currentStep) {
        setCurrentStep(step);
        return true;
      }

      // If trying to jump forward, validate current step
      if (!isCurrentStepValid()) {
        setError('Complete a etapa atual antes de prosseguir');
        return false;
      }

      setCurrentStep(step);
      return true;
    },
    [currentStep, isCurrentStepValid, setCurrentStep, setError]
  );

  /**
   * Check if wizard is on last step
   */
  const isLastStep = useMemo(() => currentStep === TOTAL_STEPS, [currentStep]);

  /**
   * Check if wizard is on first step
   */
  const isFirstStep = useMemo(() => currentStep === 1, [currentStep]);

  /**
   * Get progress percentage
   */
  const getProgressPercentage = useCallback((): number => {
    return completionPercentage;
  }, [completionPercentage]);

  /**
   * Get progress color
   */
  const getProgressColor = useCallback((): string => {
    if (completionPercentage >= 70) return 'bg-green-500';
    if (completionPercentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  }, [completionPercentage]);

  /**
   * Update a section of form data
   */
  const updateSection = useCallback(
    (
      section: keyof Omit<
        CharacterFormData,
        'name' | 'bookId' | 'voiceId' | 'voiceDescription' | 'previewAudioUrl'
      >,
      data: any
    ) => {
      updateFormData(section, data);
    },
    [updateFormData]
  );

  /**
   * Update basic fields
   */
  const updateBasicFields = useCallback(
    (data: Partial<CharacterFormData>) => {
      setFormData(data);
    },
    [setFormData]
  );

  return {
    // State
    currentStep,
    formData,
    isDirty,
    isLoading,
    isSaving,
    error,
    completionPercentage,
    lastSavedAt,
    characterId,

    // Navigation
    goToNextStep,
    goToPreviousStep,
    goToStep,
    isFirstStep,
    isLastStep,

    // Validation
    isBasicStepValid,
    isCurrentStepValid,

    // Progress
    getProgressPercentage,
    getProgressColor,

    // Updates
    updateBasicFields,
    updateSection,
    setError,

    // Reset
    resetWizard,
    loadDraft,

    // Config
    stepConfig: STEP_CONFIG,
    totalSteps: TOTAL_STEPS,
  };
}
