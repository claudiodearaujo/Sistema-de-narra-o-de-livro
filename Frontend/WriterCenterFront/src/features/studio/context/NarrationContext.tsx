import { createContext, useContext, ReactNode } from 'react';
import { useNarration } from '../../../shared/hooks/useNarration';
import { useStudioStore } from '../../../shared/stores';

// Infer the return type from the hook
type NarrationReturnType = ReturnType<typeof useNarration>;

const NarrationContext = createContext<NarrationReturnType | undefined>(undefined);

interface NarrationProviderProps {
  children: ReactNode;
}

/**
 * Provider component for Narration state
 * Wraps the useNarration hook and provides its state to the component tree
 * Ensures a single socket connection/listener set for the active chapter
 */
export function NarrationProvider({ children }: NarrationProviderProps) {
  const activeChapterId = useStudioStore((s) => s.activeChapterId);
  
  // Single instance of useNarration hooked to the active chapter
  const narration = useNarration(activeChapterId);

  return (
    <NarrationContext.Provider value={narration}>
      {children}
    </NarrationContext.Provider>
  );
}

/**
 * Hook to access shared narration state
 * Must be used within NarrationProvider
 */
export function useNarrationContext() {
  const context = useContext(NarrationContext);
  if (!context) {
    throw new Error('useNarrationContext must be used within NarrationProvider');
  }
  return context;
}
