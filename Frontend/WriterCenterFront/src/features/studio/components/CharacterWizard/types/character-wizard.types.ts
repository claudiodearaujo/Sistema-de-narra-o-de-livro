/**
 * Character Wizard Types
 * Define all interfaces and types for the Character Wizard
 */

/**
 * Form data structure for character creation/update
 */
export interface CharacterFormData {
  // Step 1: Basic (Required fields)
  name: string;
  bookId: string;
  voiceId: string;
  voiceDescription?: string;
  previewAudioUrl?: string;

  // Step 2: Identity
  identity?: CharacterIdentity;

  // Step 3: Physique
  physique?: CharacterPhysique;

  // Step 4: Face
  face?: CharacterFace;

  // Step 5: Eyes
  eyes?: CharacterEyes;

  // Step 6: Hair
  hair?: CharacterHair;

  // Step 7: Wardrobe
  wardrobe?: CharacterWardrobe;
}

/**
 * Identity section
 */
export interface CharacterIdentity {
  gender?: string; // "Masculino" | "Feminino" | "Outro"
  age?: number;
  nationality?: string;
  occupation?: string;
  birthDate?: string; // ISO date
  birthPlace?: string;
  personality?: string;
  background?: string;
}

/**
 * Physique section
 */
export interface CharacterPhysique {
  height?: string;
  weight?: string;
  bodyType?: string; // "Magra" | "Atlética" | "Média" | "Robusta" | "Musculosa"
  waist?: string;
  posture?: string; // "Erguida" | "Relaxada" | "Curvada" | "Rígida"
  skinTone?: string;
  skinTexture?: string;
  scars?: string;
  tattoos?: string;
  birthmarks?: string;
}

/**
 * Face section
 */
export interface CharacterFace {
  faceShape?: string; // "Oval" | "Redondo" | "Quadrado" | etc
  forehead?: string;
  cheekbones?: string;
  chin?: string;
  jaw?: string;
  nose?: string;
  lips?: string;
  expression?: string;
  beard?: string;
  mustache?: string;
  wrinkles?: string;
  dimples?: string;
  freckles?: string;
}

/**
 * Eyes section
 */
export interface CharacterEyes {
  eyeSize?: string;
  eyeShape?: string; // "Amendoado" | "Redondo" | "Caído" | etc
  eyeColor?: string; // "Castanho" | "Verde" | "Azul" | etc
  eyeSpacing?: string;
  eyelashes?: string;
  eyebrowShape?: string;
  eyebrowColor?: string;
  eyebrowThickness?: string;
  glasses?: string;
  makeup?: string;
}

/**
 * Hair section
 */
export interface CharacterHair {
  haircut?: string;
  hairLength?: string; // "Careca" | "Muito Curto" | "Curto" | etc
  hairColor?: string; // "Preto" | "Castanho Escuro" | etc
  hairTexture?: string; // "Liso" | "Ondulado" | "Cacheado" | etc
  hairVolume?: string;
  hairStyle?: string;
  hairPart?: string;
  hairShine?: string;
  dyedColor?: string;
  highlights?: string;
}

/**
 * Wardrobe section
 */
export interface CharacterWardrobe {
  clothingStyle?: string; // "Casual" | "Formal" | "Esportivo" | etc
  topwear?: string;
  topwearColor?: string;
  topwearBrand?: string;
  bottomwear?: string;
  bottomwearColor?: string;
  bottomwearBrand?: string;
  dress?: string;
  dressColor?: string;
  dressBrand?: string;
  footwear?: string;
  footwearColor?: string;
  footwearBrand?: string;
  heelHeight?: string;
  earrings?: string;
  necklace?: string;
  rings?: string;
  bracelets?: string;
  watch?: string;
  bag?: string;
  hat?: string;
  scarf?: string;
  nails?: string;
  perfume?: string;
}

/**
 * Wizard state
 */
export interface WizardState {
  currentStep: number;
  formData: CharacterFormData;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  completionPercentage: number;
  lastSavedAt: Date | null;
  characterId: string | null;
}

/**
 * Wizard step configuration
 */
export interface WizardStepConfig {
  id: number;
  label: string;
  description?: string;
  icon?: string;
  isRequired: boolean;
}

/**
 * Props for wizard container
 */
export interface CharacterWizardProps {
  isOpen: boolean;
  character?: CharacterFormData | null;
  characterId?: string | null;
  bookId: string;
  onClose: () => void;
  onSave?: (data: CharacterFormData) => Promise<void>;
}

/**
 * Props for individual wizard steps
 */
export interface WizardStepProps {
  data: CharacterFormData;
  onChange: (data: Partial<CharacterFormData>) => void;
  errors?: Record<string, string>;
  isLoading?: boolean;
}

/**
 * Voice option for select
 */
export interface VoiceOption {
  id: string;
  label: string;
}

/**
 * Select option for dropdowns
 */
export interface SelectOption {
  value: string;
  label: string;
}
