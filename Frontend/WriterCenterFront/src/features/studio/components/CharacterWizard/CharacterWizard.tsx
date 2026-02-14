/**
 * CharacterWizard Component
 * Main wizard container for character creation/editing
 */

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';
import { useCharacterWizard } from './hooks/useCharacterWizard';
import { useWizardAutoSave } from './hooks/useWizardAutoSave';
import { StepIndicator } from './StepIndicator';
import { WizardNavigation } from './WizardNavigation';
import { DraftNotification } from './DraftNotification';
import { BasicStep } from './steps/BasicStep';
import { IdentityStep } from './steps/IdentityStep';
import { PhysiqueStep } from './steps/PhysiqueStep';
import { FaceStep } from './steps/FaceStep';
import { EyesStep } from './steps/EyesStep';
import { HairStep } from './steps/HairStep';
import { WardrobeStep } from './steps/WardrobeStep';
import type { CharacterWizardProps } from './types/character-wizard.types';

interface CharacterWizardContainerProps extends CharacterWizardProps {
  books?: Array<{ id: string; title: string }>;
  onPreviewVoice?: (voiceId: string) => Promise<void>;
  isPreviewing?: boolean;
}

export function CharacterWizard({
  isOpen,
  character,
  characterId,
  bookId,
  books = [],
  onClose,
  onSave,
  onPreviewVoice,
  isPreviewing = false,
}: CharacterWizardContainerProps) {
  const {
    currentStep,
    formData,
    isDirty,
    isLoading,
    isSaving,
    error,
    completionPercentage,
    lastSavedAt,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    isFirstStep,
    isLastStep,
    isBasicStepValid,
    isCurrentStepValid,
    updateBasicFields,
    updateSection,
    setError,
    resetWizard,
    stepConfig,
    totalSteps,
  } = useCharacterWizard();

  // Auto-save hook
  const { performSave } = useWizardAutoSave({
    onSave: async (data) => {
      if (onSave) {
        await onSave(data);
      }
    },
    onError: (error) => {
      console.error('Auto-save error:', error);
    },
  });

  // Load draft on mount
  useEffect(() => {
    if (character) {
      const fullData = {
        name: character.name || '',
        bookId: character.bookId || bookId || '',
        voiceId: character.voiceId || 'pt-BR-FranciscaNeural',
        voiceDescription: character.voiceDescription || '',
        identity: character.identity || {},
        physique: character.physique || {},
        face: character.face || {},
        eyes: character.eyes || {},
        hair: character.hair || {},
        wardrobe: character.wardrobe || {},
      };
      // Use loadDraft or setFormData equivalent
      updateBasicFields(fullData);
    }
  }, [character, bookId, updateBasicFields]);

  const handleClose = useCallback(() => {
    resetWizard();
    onClose();
  }, [resetWizard, onClose]);

  const handleNext = useCallback(() => {
    if (goToNextStep()) {
      // Auto-save when moving to next step
      performSave();
    }
  }, [goToNextStep, performSave]);

  const handlePrevious = useCallback(() => {
    goToPreviousStep();
  }, [goToPreviousStep]);

  const handleConfirm = useCallback(async () => {
    try {
      await performSave();
      // Close wizard after successful save
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      setError('Erro ao salvar personagem');
      console.error(err);
    }
  }, [performSave, handleClose, setError]);

  const handleStepClick = useCallback(
    (step: number) => {
      goToStep(step);
    },
    [goToStep]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-100">
              {character ? 'Editar Personagem' : 'Novo Personagem'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-zinc-800 rounded transition-colors"
            aria-label="Fechar"
            disabled={isSaving}
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          completionPercentage={completionPercentage}
          stepLabels={stepConfig.map((s) => s.label)}
          onStepClick={handleStepClick}
          isBasicStepValid={isBasicStepValid()}
        />

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 1 && (
            <BasicStep
              data={formData}
              onChange={updateBasicFields}
              books={books}
              onPreviewVoice={onPreviewVoice}
              isPreviewing={isPreviewing}
              isLoading={isLoading}
            />
          )}

          {currentStep === 2 && (
            <IdentityStep
              data={formData}
              onChange={(data) => {
                if (data.identity) {
                  updateSection('identity', data.identity);
                } else {
                  updateBasicFields(data);
                }
              }}
              isLoading={isLoading}
            />
          )}

          {currentStep === 3 && (
            <PhysiqueStep
              data={formData}
              onChange={(data) => {
                if (data.physique) {
                  updateSection('physique', data.physique);
                } else {
                  updateBasicFields(data);
                }
              }}
              isLoading={isLoading}
            />
          )}

          {currentStep === 4 && (
            <FaceStep
              data={formData}
              onChange={(data) => {
                if (data.face) {
                  updateSection('face', data.face);
                } else {
                  updateBasicFields(data);
                }
              }}
              isLoading={isLoading}
            />
          )}

          {currentStep === 5 && (
            <EyesStep
              data={formData}
              onChange={(data) => {
                if (data.eyes) {
                  updateSection('eyes', data.eyes);
                } else {
                  updateBasicFields(data);
                }
              }}
              isLoading={isLoading}
            />
          )}

          {currentStep === 6 && (
            <HairStep
              data={formData}
              onChange={(data) => {
                if (data.hair) {
                  updateSection('hair', data.hair);
                } else {
                  updateBasicFields(data);
                }
              }}
              isLoading={isLoading}
            />
          )}

          {currentStep === 7 && (
            <WardrobeStep
              data={formData}
              onChange={(data) => {
                if (data.wardrobe) {
                  updateSection('wardrobe', data.wardrobe);
                } else {
                  updateBasicFields(data);
                }
              }}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-900/20 border-t border-red-800 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <WizardNavigation
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          isLoading={isLoading}
          isSaving={isSaving}
          isCurrentStepValid={isCurrentStepValid()}
          onBack={handlePrevious}
          onNext={handleNext}
          onConfirm={handleConfirm}
          confirmLabel="Salvar Personagem"
        />

        {/* Auto-save notification */}
        <DraftNotification
          type={error ? 'error' : 'success'}
          message="Rascunho auto-salvo"
          lastSavedAt={lastSavedAt}
          error={error}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
