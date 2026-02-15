import { useParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Minimize2 } from 'lucide-react';
import { useStudioStore, useUIStore } from '../../shared/stores';
import { useStudio } from './hooks/useStudio';
import { TopBar } from './components/TopBar/TopBar';
import { StatusBar } from './components/StatusBar/StatusBar';
import { LeftSidebar } from './components/LeftSidebar/LeftSidebar';
import { Canvas } from './components/Canvas/Canvas';
import { RightPanel } from './components/RightPanel/RightPanel';
import { CharacterWizardProvider, useCharacterWizardModal } from './context/CharacterWizardContext';
import { CharacterWizardModal } from './components/CharacterWizard/CharacterWizardModal';
import { NarrationProvider } from './context/NarrationContext';

/**
 * Inner content component that uses CharacterWizardModal context
 */
function StudioPageContent() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId?: string }>();
  const setActiveBook = useStudioStore((state) => state.setActiveBook);
  const setActiveChapter = useStudioStore((state) => state.setActiveChapter);
  const leftSidebarOpen = useUIStore((state) => state.leftSidebarOpen);
  const rightPanelOpen = useUIStore((state) => state.rightPanelOpen);
  const focusMode = useUIStore((state) => state.focusMode);
  const setFocusMode = useUIStore((state) => state.setFocusMode);
  const setLeftSidebarOpen = useUIStore((state) => state.setLeftSidebarOpen);
  const sidebarStateBeforeFocus = useRef(leftSidebarOpen);
  const previousChapterId = useRef(chapterId);
  const hasInitializedChapterlessView = useRef(false);

  // Composite hook — activates keyboard shortcuts & beforeunload guard
  useStudio();

  useEffect(() => {
    if (bookId) {
      setActiveBook(bookId);
    }
  }, [bookId, setActiveBook]);

  useEffect(() => {
    if (chapterId) {
      setActiveChapter(chapterId);
    }
  }, [chapterId, setActiveChapter]);

  // Enforce chapter picker visibility only once on initial chapterless load,
  // or when transitioning from a selected chapter back to no chapter.
  useEffect(() => {
    const hadSelectedChapter = Boolean(previousChapterId.current);
    const hasSelectedChapter = Boolean(chapterId);
    const isInitialChapterlessLoad = !hasSelectedChapter && !hasInitializedChapterlessView.current;
    const leftSelectedChapter = !hasSelectedChapter && hadSelectedChapter;

    if (isInitialChapterlessLoad || leftSelectedChapter) {
      if (focusMode) {
        setFocusMode(false);
      }

      if (!leftSidebarOpen) {
        setLeftSidebarOpen(true);
      }
    }

    if (!hasSelectedChapter) {
      hasInitializedChapterlessView.current = true;
    }

    previousChapterId.current = chapterId;
  }, [chapterId, focusMode, leftSidebarOpen, setFocusMode, setLeftSidebarOpen]);

  useEffect(() => {
    if (!focusMode) {
      return;
    }

    sidebarStateBeforeFocus.current = leftSidebarOpen;
  }, [focusMode, leftSidebarOpen]);

  const handleExitFocusMode = () => {
    setFocusMode(false);
    setLeftSidebarOpen(sidebarStateBeforeFocus.current);
  };

  const { isOpen: wizardOpen, characterId, closeWizard } = useCharacterWizardModal();

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Top Bar */}
      {!focusMode && <TopBar />}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {!focusMode && leftSidebarOpen && (
          <aside className="w-72 border-r border-zinc-800 flex flex-col">
            <LeftSidebar />
          </aside>
        )}

        {/* Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Canvas />
        </main>

        {/* Right Panel */}
        {!focusMode && rightPanelOpen && (
          <aside className="w-96 border-l border-zinc-800 flex flex-col">
            <RightPanel />
          </aside>
        )}
      </div>

      {/* Status Bar */}
      {!focusMode && <StatusBar />}

      {/* Focus mode escape button */}
      {focusMode && (
        <button
          onClick={handleExitFocusMode}
          className="fixed top-3 right-3 z-50 p-2.5 bg-zinc-900/20 hover:bg-zinc-800/55 border border-zinc-500/25 rounded-full text-zinc-100/65 hover:text-zinc-100 backdrop-blur-sm transition-all"
          title="Sair do modo maximizado (Esc)"
          aria-label="Sair do modo maximizado"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      )}

      {/* Character Wizard Modal */}
      {wizardOpen && (
        <CharacterWizardModal characterId={characterId} onClose={closeWizard} />
      )}
    </div>
  );
}

/**
 * Main Writer Studio page with 3-zone layout and Character Wizard integration.
 * The useStudio hook handles keyboard shortcuts, beforeunload guard,
 * and data orchestration for the entire page.
 * The CharacterWizardProvider enables the wizard modal functionality.
 */
export function StudioPage() {
  return (
    <CharacterWizardProvider>
      <NarrationProvider>
        <StudioPageContent />
      </NarrationProvider>
    </CharacterWizardProvider>
  );
}
