import { useState } from 'react';
import { FileText, Users, BarChart3 } from 'lucide-react';
import { useStudioStore } from '../../../../shared/stores';
import { useChapters, useCreateChapter } from '../../../../shared/hooks/useChapters';
import { useCharacters } from '../../../../shared/hooks/useCharacters';
import { useNarration } from '../../../../shared/hooks/useNarration';
import { http } from '../../../../shared/api/http';
import { endpoints } from '../../../../shared/api/endpoints';
import { ChapterTree } from './ChapterTree';
import { CharacterList } from './CharacterList';
import { ChapterTools } from './ChapterTools';
import { cn } from '../../../../shared/lib/utils';

type Tab = 'chapters' | 'characters' | 'stats';

const TABS = [
  { id: 'chapters' as Tab, label: 'Capítulos', icon: FileText },
  { id: 'characters' as Tab, label: 'Personagens', icon: Users },
  { id: 'stats' as Tab, label: 'Estatísticas', icon: BarChart3 },
];

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('chapters');

  const activeBookId = useStudioStore((s) => s.activeBookId);
  const activeChapterId = useStudioStore((s) => s.activeChapterId);
  const setActiveChapter = useStudioStore((s) => s.setActiveChapter);

  const { data: chapters = [], isLoading: chaptersLoading } = useChapters(activeBookId);
  const { data: characters = [], isLoading: charactersLoading } = useCharacters(activeBookId);

  const narration = useNarration(activeChapterId);
  const createChapter = useCreateChapter();

  const handleNewChapter = async () => {
    if (!activeBookId) return;
    const title = prompt('Nome do novo capítulo:');
    if (!title?.trim()) return;
    await createChapter.mutateAsync({ bookId: activeBookId, title: title.trim() });
  };

  const handleNarrate = async () => {
    if (!activeChapterId || narration.isNarrating) return;
    await narration.start();
  };

  const handlePreviewAudio = async (characterId: string) => {
    try {
      await http.post(endpoints.characters.previewAudio(characterId), {
        text: 'Olá, este é um teste de voz.',
      });
    } catch {
      // Preview audio is best-effort
    }
  };

  const activeChapter = chapters.find((c) => c.id === activeChapterId);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800 shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-amber-400 border-b-2 border-amber-500'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className="w-3.5 h-3.5 mx-auto mb-1" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 flex flex-col">
        {activeTab === 'chapters' && (
          <>
            <ChapterTree
              bookId={activeBookId ?? ''}
              chapters={chapters}
              activeChapterId={activeChapterId}
              isLoading={chaptersLoading}
              onSelectChapter={setActiveChapter}
              onNewChapter={handleNewChapter}
            />
            {activeChapterId && activeChapter && (
              <ChapterTools
                chapterId={activeChapterId}
                onNarrate={handleNarrate}
                isNarrating={narration.isNarrating}
                narrationProgress={narration.overallProgress}
                onExport={() => {}}
              />
            )}
          </>
        )}

        {activeTab === 'characters' && (
          <CharacterList
            characters={characters}
            isLoading={charactersLoading}
            onNewCharacter={() => {}}
            onPreviewAudio={handlePreviewAudio}
          />
        )}

        {activeTab === 'stats' && (
          <div className="space-y-3">
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 space-y-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Livro</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-lg font-semibold text-zinc-200">{chapters.length}</p>
                  <p className="text-[10px] text-zinc-600">capítulos</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-zinc-200">{characters.length}</p>
                  <p className="text-[10px] text-zinc-600">personagens</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-zinc-200">
                    {chapters.reduce((sum, c) => sum + (c.wordCount ?? 0), 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-[10px] text-zinc-600">palavras totais</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-zinc-200">
                    {chapters.reduce((sum, c) => sum + (c.speechesCount ?? 0), 0)}
                  </p>
                  <p className="text-[10px] text-zinc-600">falas totais</p>
                </div>
              </div>
            </div>

            {activeChapter && (
              <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 space-y-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Capítulo atual</p>
                <p className="text-xs text-zinc-400 truncate">{activeChapter.title}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-lg font-semibold text-zinc-200">
                      {activeChapter.wordCount.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-[10px] text-zinc-600">palavras</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-zinc-200">{activeChapter.speechesCount}</p>
                    <p className="text-[10px] text-zinc-600">falas</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
