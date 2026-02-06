import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useStudioStore, useUIStore } from '../../shared/stores';
import { TopBar } from './components/TopBar/TopBar';
import { StatusBar } from './components/StatusBar/StatusBar';
import { LeftSidebar } from './components/LeftSidebar/LeftSidebar';
import { Canvas } from './components/Canvas/Canvas';
import { RightPanel } from './components/RightPanel/RightPanel';

/**
 * Main Writer Studio page with 3-zone layout
 */
export function StudioPage() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId?: string }>();
  const setActiveBook = useStudioStore((state) => state.setActiveBook);
  const setActiveChapter = useStudioStore((state) => state.setActiveChapter);
  const leftSidebarOpen = useUIStore((state) => state.leftSidebarOpen);
  const rightPanelOpen = useUIStore((state) => state.rightPanelOpen);
  const focusMode = useUIStore((state) => state.focusMode);

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
    </div>
  );
}
