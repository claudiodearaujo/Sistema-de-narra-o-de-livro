/**
 * Character Wizard Modal
 * Wrapper component that displays the Character Wizard in a full-screen modal dialog
 * Manages wizard state and integrates with WriterCenterFront layout
 */

import { useEffect } from 'react';
import { useStudioStore, useUIStore } from '../../../../shared/stores';
import { CharacterWizard } from './CharacterWizard';
import { useCharacterWizardStore } from './stores/characterWizardStore';

interface CharacterWizardModalProps {
  /**
   * Character ID to edit, or undefined for creating new character
   */
  characterId?: string;
  /**
   * Called when wizard closes
   */
  onClose: () => void;
}

/**
 * Full-screen modal dialog for Character Wizard
 * Overlays the entire studio interface
 */
export function CharacterWizardModal({ characterId, onClose }: CharacterWizardModalProps) {
  const activeBookId = useStudioStore((s) => s.activeBookId);
  const resetWizard = useCharacterWizardStore((s) => s.reset);

  // Reset wizard state when opening/closing or switching character
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      resetWizard();
    };
  }, [characterId, resetWizard]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Modal container */}
      <div className="w-full max-w-2xl h-screen sm:h-auto sm:max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <CharacterWizard
          isOpen={true}
          bookId={activeBookId || ''}
          characterId={characterId}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
