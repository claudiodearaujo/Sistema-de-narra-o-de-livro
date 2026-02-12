import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Minimize2 } from 'lucide-react';
import { useStudioStore, useUIStore } from '../../shared/stores';
import { useStudio } from './hooks/useStudio';
import { TopBar } from './components/TopBar/TopBar';
import { StatusBar } from './components/StatusBar/StatusBar';
import { LeftSidebar } from './components/LeftSidebar/LeftSidebar';
import { Canvas } from './components/Canvas/Canvas';
import { RightPanel } from './components/RightPanel/RightPanel';

/**
 * Main Writer Studio page with 3-zone layout.
 * The useStudio hook handles keyboard shortcuts, beforeunload guard,
 * and data orchestration for the entire page.
 */
export function StudioPage() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId?: string }>();
  const setActiveBook = useStudioStore((state) => state.setActiveBook);
  const setActiveChapter = useStudioStore((state) => state.setActiveChapter);
  const leftSidebarOpen = useUIStore((state) => state.leftSidebarOpen);
  const rightPanelOpen = useUIStore((state) => state.rightPanelOpen);
  const focusMode = useUIStore((state) => state.focusMode);
  const setFocusMode = useUIStore((state) => state.setFocusMode);
  const setLeftSidebarOpen = useUIStore((state) => state.setLeftSidebarOpen);

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

  const handleExitFocusMode = () => {
    setFocusMode(false);
    setLeftSidebarOpen(true);
  };

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
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs backdrop-blur-sm transition-all opacity-60 hover:opacity-100"
          title="Sair do modo foco (Esc)"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Sair do modo foco</span>
        </button>
      )}
    </div>
  );
}
