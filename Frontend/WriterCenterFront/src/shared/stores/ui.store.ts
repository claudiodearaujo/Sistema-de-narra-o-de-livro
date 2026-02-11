import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type PanelType = 'ai' | 'media' | 'properties' | null;

interface UIStore {
  // Sidebar state
  leftSidebarOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelType: PanelType;
  
  // Focus mode
  focusMode: boolean;
  
  // Editor state
  selectedSpeechIds: string[];
  
  // Actions
  toggleLeftSidebar: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelType: (type: PanelType) => void;
  openRightPanel: (type: PanelType) => void;
  closeRightPanel: () => void;
  
  toggleFocusMode: () => void;
  setFocusMode: (enabled: boolean) => void;
  
  setSelectedSpeechIds: (ids: string[]) => void;
  toggleSpeechSelection: (id: string) => void;
  clearSelection: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      leftSidebarOpen: true,
      rightPanelOpen: false,
      rightPanelType: null,
      focusMode: false,
      selectedSpeechIds: [],

      toggleLeftSidebar: () =>
        set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),

      setLeftSidebarOpen: (open) =>
        set({ leftSidebarOpen: open }),

      toggleRightPanel: () =>
        set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),

      setRightPanelOpen: (open) =>
        set({ rightPanelOpen: open }),

      setRightPanelType: (type) =>
        set({ rightPanelType: type }),

      openRightPanel: (type) =>
        set({ rightPanelOpen: true, rightPanelType: type }),

      closeRightPanel: () =>
        set({ rightPanelOpen: false, rightPanelType: null }),

      toggleFocusMode: () =>
        set((state) => ({ focusMode: !state.focusMode })),

      setFocusMode: (enabled) =>
        set({ focusMode: enabled }),

      setSelectedSpeechIds: (ids) =>
        set({ selectedSpeechIds: ids }),

      toggleSpeechSelection: (id) =>
        set((state) => ({
          selectedSpeechIds: state.selectedSpeechIds.includes(id)
            ? state.selectedSpeechIds.filter((sid) => sid !== id)
            : [...state.selectedSpeechIds, id],
        })),

      clearSelection: () =>
        set({ selectedSpeechIds: [] }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        leftSidebarOpen: state.leftSidebarOpen,
        focusMode: state.focusMode,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
