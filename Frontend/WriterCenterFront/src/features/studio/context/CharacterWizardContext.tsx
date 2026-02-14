/**
 * Character Wizard Context
 * Provides global state management for Character Wizard modal
 * Allows opening/closing wizard from any component in the studio
 */

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface CharacterWizardContextType {
  isOpen: boolean;
  characterId?: string;
  openWizard: (characterId?: string) => void;
  closeWizard: () => void;
}

const CharacterWizardContext = createContext<CharacterWizardContextType | undefined>(
  undefined
);

interface CharacterWizardProviderProps {
  children: ReactNode;
}

/**
 * Provider component for Character Wizard modal state
 * Wrap your component tree with this to enable wizard modal functionality
 */
export function CharacterWizardProvider({ children }: CharacterWizardProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [characterId, setCharacterId] = useState<string | undefined>();

  const openWizard = useCallback((id?: string) => {
    setCharacterId(id);
    setIsOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setIsOpen(false);
    // Clear character ID after closing animation completes (300ms)
    setTimeout(() => setCharacterId(undefined), 300);
  }, []);

  const value: CharacterWizardContextType = {
    isOpen,
    characterId,
    openWizard,
    closeWizard,
  };

  return (
    <CharacterWizardContext.Provider value={value}>
      {children}
    </CharacterWizardContext.Provider>
  );
}

/**
 * Hook to access Character Wizard modal state and actions
 * Must be used within CharacterWizardProvider
 *
 * @returns {Object} Object with modal state and control functions
 */
export function useCharacterWizardModal() {
  const context = useContext(CharacterWizardContext);

  if (!context) {
    throw new Error(
      'useCharacterWizardModal must be used within CharacterWizardProvider'
    );
  }

  return context;
}
