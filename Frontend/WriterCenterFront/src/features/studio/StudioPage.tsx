import { useParams } from 'react-router-dom';
import { useEffect, useRef, useCallback } from 'react';
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

/** Check if viewport is mobile-sized (< 640px, matching Tailwind's sm breakpoint) */
function useIsMobile() {
  const ref = useRef(typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e: MediaQueryListEvent) => { ref.current = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return ref;
}

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
  const closeRightPanel = useUIStore((state) => state.closeRightPanel);
  const sidebarStateBeforeFocus = useRef(leftSidebarOpen);
  const isMobileRef = useIsMobile();

  /** On mobile, close sidebars when tapping the canvas area */
  const handleCanvasClick = useCallback(() => {
    if (!isMobileRef.current) return;
    if (leftSidebarOpen) setLeftSidebarOpen(false);
    if (rightPanelOpen) closeRightPanel();
  }, [leftSidebarOpen, rightPanelOpen, setLeftSidebarOpen, closeRightPanel, isMobileRef]);

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

  // When entering the page without a selected chapter, exit focus mode
  // and ensure sidebar is visible so the user can pick a chapter.
  useEffect(() => {
    if (!chapterId && focusMode) {
      setFocusMode(false);
    }
    if (!chapterId && !leftSidebarOpen) {
      setLeftSidebarOpen(true);
    }
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
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay backdrop when sidebar is open */}
        {!focusMode && (leftSidebarOpen || rightPanelOpen) && (
          <div
            className="sm:hidden fixed inset-0 bg-black/50 z-30"
            onClick={handleCanvasClick}
            aria-hidden="true"
          />
        )}

        {/* Left Sidebar — overlay on mobile, inline on desktop */}
        {!focusMode && leftSidebarOpen && (
          <aside className="
            w-[85vw] sm:w-72
            fixed sm:relative inset-y-0 left-0 z-40 sm:z-auto
            top-12 sm:top-0
            border-r border-zinc-800 flex flex-col
            bg-zinc-950 sm:bg-transparent
            shadow-2xl sm:shadow-none
          ">
            <LeftSidebar />
          </aside>
        )}

        {/* Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Canvas />
        </main>

        {/* Right Panel — overlay on mobile, inline on desktop */}
        {!focusMode && rightPanelOpen && (
          <aside className="
            w-[90vw] sm:w-96
            fixed sm:relative inset-y-0 right-0 z-40 sm:z-auto
            top-12 sm:top-0
            border-l border-zinc-800 flex flex-col
            bg-zinc-950 sm:bg-transparent
            shadow-2xl sm:shadow-none
          ">
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
