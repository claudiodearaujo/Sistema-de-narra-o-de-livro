/**
 * CharacterWizard Component
 * Main wizard container for character creation/editing with API integration
 */

import { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { useCharacterWizard } from './hooks/useCharacterWizard';
import { useWizardAutoSave } from './hooks/useWizardAutoSave';
import { useCharacterWizardApi } from '../../../../shared/api/characterApi';
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

type CharacterWizardContainerProps = CharacterWizardProps;

export function CharacterWizard({
  isOpen,
  character,
  characterId,
  bookId,
  onClose,
  onSave,
}: CharacterWizardContainerProps) {
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  const {
    currentStep,
    formData,
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

  // API integration
  const {
    saveCharacter,
    previewVoice,
    isLoading: apiIsLoading,
    error: apiError,
    isPreviewing,
  } = useCharacterWizardApi(bookId, characterId || undefined);

  // Auto-save hook with API integration
  const { performSave } = useWizardAutoSave({
    bookId,
    characterId,
    onSave: async (data) => {
      // Use API service if available, otherwise use custom onSave
      if (saveCharacter) {
        const result = await saveCharacter(data);
        if (onSave) {
          await onSave(data);
        }
        return result;
      } else if (onSave) {
        await onSave(data);
      }
    },
    onError: (error) => {
      console.error('Auto-save error:', error);
      setError(error.message);
    },
  });

  // Load character data on mount or when characterId changes
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
      updateBasicFields(fullData);
    } else {
      // New character - set default bookId
      updateBasicFields({
        bookId,
        voiceId: 'pt-BR-FranciscaNeural',
      });
    }
  }, [character, bookId, characterId, updateBasicFields]);

  // Sync API errors with wizard state
  useEffect(() => {
    if (apiError) {
      setError(apiError.message);
    }
  }, [apiError, setError]);

  const handleClose = useCallback(() => {
    previewAudioRef.current?.pause();
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
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
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar personagem';
      setError(errorMessage);
      console.error(err);
    }
  }, [performSave, handleClose, setError]);

  const handleStepClick = useCallback(
    (step: number) => {
      goToStep(step);
    },
    [goToStep]
  );

  const handlePreviewVoice = useCallback(
    async (voiceId: string) => {
      const preview = await previewVoice(voiceId);

      previewAudioRef.current?.pause();
      previewAudioRef.current = null;

      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }

      const audio = new Audio(preview.audioUrl);
      previewAudioRef.current = audio;

      if (preview.revokeAfterPlay) {
        previewObjectUrlRef.current = preview.audioUrl;
        audio.addEventListener('ended', () => {
          if (previewObjectUrlRef.current) {
            URL.revokeObjectURL(previewObjectUrlRef.current);
            previewObjectUrlRef.current = null;
          }
        }, { once: true });
      }

      await audio.play();
    },
    [previewVoice]
  );

  useEffect(() => {
    return () => {
      previewAudioRef.current?.pause();
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  // Combine loading states
  const isAnyLoading = isLoading || apiIsLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-100">
              {characterId ? 'Editar Personagem' : 'Novo Personagem'}
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
              onPreviewVoice={handlePreviewVoice}
              isPreviewing={isPreviewing}
              isLoading={isAnyLoading}
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
              isLoading={isAnyLoading}
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
              isLoading={isAnyLoading}
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
              isLoading={isAnyLoading}
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
              isLoading={isAnyLoading}
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
              isLoading={isAnyLoading}
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
              isLoading={isAnyLoading}
            />
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-900/20 border-t border-red-800 text-red-200 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Navigation */}
        <WizardNavigation
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          isLoading={isAnyLoading}
          isSaving={isSaving}
          isCurrentStepValid={isCurrentStepValid()}
          onBack={handlePrevious}
          onNext={handleNext}
          onConfirm={handleConfirm}
          confirmLabel={characterId ? 'Salvar Alterações' : 'Criar Personagem'}
        />

        {/* Auto-save notification */}
        <DraftNotification
          message={characterId ? 'Alterações auto-salvas' : 'Rascunho auto-salvo'}
          lastSavedAt={lastSavedAt}
          error={error}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
