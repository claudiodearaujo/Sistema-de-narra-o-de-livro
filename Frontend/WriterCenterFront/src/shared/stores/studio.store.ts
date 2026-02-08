import { create } from 'zustand';

interface StudioStore {
  // Active book and chapter
  activeBookId: string | null;
  activeChapterId: string | null;
  
  // Editing state
  editingSpeechId: string | null;
  editingText: string;
  
  // Auto-save state
  isDirty: boolean;
  lastSavedAt: Date | null;
  
  // Actions
  setActiveBook: (bookId: string) => void;
  setActiveChapter: (chapterId: string) => void;
  
  startEditingSpeech: (speechId: string, text: string) => void;
  updateEditingText: (text: string) => void;
  cancelEditing: () => void;
  
  markDirty: () => void;
  markClean: () => void;
  updateLastSavedAt: () => void;
}

export const useStudioStore = create<StudioStore>((set) => ({
  activeBookId: null,
  activeChapterId: null,
  editingSpeechId: null,
  editingText: '',
  isDirty: false,
  lastSavedAt: null,

  setActiveBook: (bookId) =>
    set({ activeBookId: bookId }),

  setActiveChapter: (chapterId) =>
    set({ activeChapterId: chapterId }),

  startEditingSpeech: (speechId, text) =>
    set({ editingSpeechId: speechId, editingText: text }),

  updateEditingText: (text) => {
    set({ editingText: text, isDirty: true });
  },

  cancelEditing: () =>
    set({ editingSpeechId: null, editingText: '' }),

  markDirty: () =>
    set({ isDirty: true }),

  markClean: () =>
    set({ isDirty: false }),

  updateLastSavedAt: () =>
    set({ lastSavedAt: new Date(), isDirty: false }),
}));
