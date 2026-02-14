/**
 * Character Wizard Zustand Store
 * Manages wizard state with localStorage persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CharacterFormData, WizardState } from '../types/character-wizard.types';

const INITIAL_FORM_DATA: CharacterFormData = {
  name: '',
  bookId: '',
  voiceId: 'pt-BR-FranciscaNeural',
  voiceDescription: '',
  identity: {},
  physique: {},
  face: {},
  eyes: {},
  hair: {},
  wardrobe: {},
};

interface CharacterWizardStoreState extends WizardState {
  // Actions
  setCurrentStep: (step: number) => void;
  setFormData: (data: Partial<CharacterFormData>) => void;
  updateFormData: (section: keyof Omit<CharacterFormData, 'name' | 'bookId' | 'voiceId' | 'voiceDescription' | 'previewAudioUrl'>, data: any) => void;
  setIsDirty: (isDirty: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;
  setCharacterId: (id: string | null) => void;
  setLastSavedAt: (date: Date | null) => void;
  calculateCompletion: () => number;
  resetWizard: () => void;
  loadDraft: (data: CharacterFormData, characterId?: string) => void;
}

export const useCharacterWizardStore = create<CharacterWizardStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 1,
      formData: INITIAL_FORM_DATA,
      isDirty: false,
      isLoading: false,
      isSaving: false,
      error: null,
      completionPercentage: 0,
      lastSavedAt: null,
      characterId: null,

      // Actions
      setCurrentStep: (step: number) => set({ currentStep: step }),

      setFormData: (data: Partial<CharacterFormData>) => {
        set((state) => ({
          formData: { ...state.formData, ...data },
          isDirty: true,
          completionPercentage: get().calculateCompletion(),
        }));
      },

      updateFormData: (section, data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            [section]: {
              ...state.formData[section as keyof CharacterFormData],
              ...data,
            },
          },
          isDirty: true,
          completionPercentage: get().calculateCompletion(),
        }));
      },

      setIsDirty: (isDirty: boolean) => set({ isDirty }),

      setIsLoading: (isLoading: boolean) => set({ isLoading }),

      setIsSaving: (isSaving: boolean) => set({ isSaving }),

      setError: (error: string | null) => set({ error }),

      setCharacterId: (id: string | null) => set({ characterId: id }),

      setLastSavedAt: (date: Date | null) => set({ lastSavedAt: date }),

      calculateCompletion: () => {
        const state = get();
        const { formData } = state;

        // Count filled fields
        let filledFields = 0;
        let totalFields = 0;

        // Step 1: Basic (3 required fields)
        totalFields += 3;
        if (formData.name?.trim()) filledFields++;
        if (formData.bookId?.trim()) filledFields++;
        if (formData.voiceId?.trim()) filledFields++;

        // Step 2: Identity (8 optional fields)
        totalFields += 8;
        if (formData.identity?.gender?.trim()) filledFields++;
        if (formData.identity?.age) filledFields++;
        if (formData.identity?.nationality?.trim()) filledFields++;
        if (formData.identity?.occupation?.trim()) filledFields++;
        if (formData.identity?.birthDate?.trim()) filledFields++;
        if (formData.identity?.birthPlace?.trim()) filledFields++;
        if (formData.identity?.personality?.trim()) filledFields++;
        if (formData.identity?.background?.trim()) filledFields++;

        // Step 3: Physique (10 optional fields)
        totalFields += 10;
        if (formData.physique?.height?.trim()) filledFields++;
        if (formData.physique?.weight?.trim()) filledFields++;
        if (formData.physique?.bodyType?.trim()) filledFields++;
        if (formData.physique?.waist?.trim()) filledFields++;
        if (formData.physique?.posture?.trim()) filledFields++;
        if (formData.physique?.skinTone?.trim()) filledFields++;
        if (formData.physique?.skinTexture?.trim()) filledFields++;
        if (formData.physique?.scars?.trim()) filledFields++;
        if (formData.physique?.tattoos?.trim()) filledFields++;
        if (formData.physique?.birthmarks?.trim()) filledFields++;

        // Step 4: Face (13 optional fields)
        totalFields += 13;
        if (formData.face?.faceShape?.trim()) filledFields++;
        if (formData.face?.forehead?.trim()) filledFields++;
        if (formData.face?.cheekbones?.trim()) filledFields++;
        if (formData.face?.chin?.trim()) filledFields++;
        if (formData.face?.jaw?.trim()) filledFields++;
        if (formData.face?.nose?.trim()) filledFields++;
        if (formData.face?.lips?.trim()) filledFields++;
        if (formData.face?.expression?.trim()) filledFields++;
        if (formData.face?.beard?.trim()) filledFields++;
        if (formData.face?.mustache?.trim()) filledFields++;
        if (formData.face?.wrinkles?.trim()) filledFields++;
        if (formData.face?.dimples?.trim()) filledFields++;
        if (formData.face?.freckles?.trim()) filledFields++;

        // Step 5: Eyes (10 optional fields)
        totalFields += 10;
        if (formData.eyes?.eyeSize?.trim()) filledFields++;
        if (formData.eyes?.eyeShape?.trim()) filledFields++;
        if (formData.eyes?.eyeColor?.trim()) filledFields++;
        if (formData.eyes?.eyeSpacing?.trim()) filledFields++;
        if (formData.eyes?.eyelashes?.trim()) filledFields++;
        if (formData.eyes?.eyebrowShape?.trim()) filledFields++;
        if (formData.eyes?.eyebrowColor?.trim()) filledFields++;
        if (formData.eyes?.eyebrowThickness?.trim()) filledFields++;
        if (formData.eyes?.glasses?.trim()) filledFields++;
        if (formData.eyes?.makeup?.trim()) filledFields++;

        // Step 6: Hair (10 optional fields)
        totalFields += 10;
        if (formData.hair?.haircut?.trim()) filledFields++;
        if (formData.hair?.hairLength?.trim()) filledFields++;
        if (formData.hair?.hairColor?.trim()) filledFields++;
        if (formData.hair?.hairTexture?.trim()) filledFields++;
        if (formData.hair?.hairVolume?.trim()) filledFields++;
        if (formData.hair?.hairStyle?.trim()) filledFields++;
        if (formData.hair?.hairPart?.trim()) filledFields++;
        if (formData.hair?.hairShine?.trim()) filledFields++;
        if (formData.hair?.dyedColor?.trim()) filledFields++;
        if (formData.hair?.highlights?.trim()) filledFields++;

        // Step 7: Wardrobe (24 optional fields)
        totalFields += 24;
        if (formData.wardrobe?.clothingStyle?.trim()) filledFields++;
        if (formData.wardrobe?.topwear?.trim()) filledFields++;
        if (formData.wardrobe?.topwearColor?.trim()) filledFields++;
        if (formData.wardrobe?.topwearBrand?.trim()) filledFields++;
        if (formData.wardrobe?.bottomwear?.trim()) filledFields++;
        if (formData.wardrobe?.bottomwearColor?.trim()) filledFields++;
        if (formData.wardrobe?.bottomwearBrand?.trim()) filledFields++;
        if (formData.wardrobe?.dress?.trim()) filledFields++;
        if (formData.wardrobe?.dressColor?.trim()) filledFields++;
        if (formData.wardrobe?.dressBrand?.trim()) filledFields++;
        if (formData.wardrobe?.footwear?.trim()) filledFields++;
        if (formData.wardrobe?.footwearColor?.trim()) filledFields++;
        if (formData.wardrobe?.footwearBrand?.trim()) filledFields++;
        if (formData.wardrobe?.heelHeight?.trim()) filledFields++;
        if (formData.wardrobe?.earrings?.trim()) filledFields++;
        if (formData.wardrobe?.necklace?.trim()) filledFields++;
        if (formData.wardrobe?.rings?.trim()) filledFields++;
        if (formData.wardrobe?.bracelets?.trim()) filledFields++;
        if (formData.wardrobe?.watch?.trim()) filledFields++;
        if (formData.wardrobe?.bag?.trim()) filledFields++;
        if (formData.wardrobe?.hat?.trim()) filledFields++;
        if (formData.wardrobe?.scarf?.trim()) filledFields++;
        if (formData.wardrobe?.nails?.trim()) filledFields++;
        if (formData.wardrobe?.perfume?.trim()) filledFields++;

        const percentage = Math.round((filledFields / totalFields) * 100);
        return percentage;
      },

      resetWizard: () => {
        set({
          currentStep: 1,
          formData: { ...INITIAL_FORM_DATA },
          isDirty: false,
          isLoading: false,
          isSaving: false,
          error: null,
          completionPercentage: 0,
          lastSavedAt: null,
          characterId: null,
        });
      },

      loadDraft: (data: CharacterFormData, characterId?: string) => {
        set({
          formData: data,
          characterId: characterId || null,
          isDirty: false,
          completionPercentage: get().calculateCompletion(),
        });
      },
    }),
    {
      name: 'character-wizard-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        formData: state.formData,
        currentStep: state.currentStep,
        characterId: state.characterId,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
);
