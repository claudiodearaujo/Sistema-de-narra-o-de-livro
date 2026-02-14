/**
 * Character Wizard Exports
 * Main entry point for the Character Wizard component
 */

export { CharacterWizard } from './CharacterWizard';
export { useCharacterWizard } from './hooks/useCharacterWizard';
export { useWizardAutoSave } from './hooks/useWizardAutoSave';
export { useCharacterWizardStore } from './stores/characterWizardStore';

// Components
export { StepIndicator } from './StepIndicator';
export { WizardNavigation } from './WizardNavigation';
export { WizardStep } from './WizardStep';
export { FormField } from './FormField';
export { DraftNotification } from './DraftNotification';

// Steps
export { BasicStep } from './steps/BasicStep';
export { IdentityStep } from './steps/IdentityStep';
export { PhysiqueStep } from './steps/PhysiqueStep';
export { FaceStep } from './steps/FaceStep';
export { EyesStep } from './steps/EyesStep';
export { HairStep } from './steps/HairStep';
export { WardrobeStep } from './steps/WardrobeStep';

// Types
export type {
  CharacterFormData,
  CharacterIdentity,
  CharacterPhysique,
  CharacterFace,
  CharacterEyes,
  CharacterHair,
  CharacterWardrobe,
  WizardState,
  CharacterWizardProps,
  WizardStepProps,
} from './types/character-wizard.types';
