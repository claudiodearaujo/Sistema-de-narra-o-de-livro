import { useUIStore } from '../../../../shared/stores';
import { X, Bot, Image, Settings } from 'lucide-react';
import { AiChat } from './AiChat';
import { MediaPanel } from './MediaPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { cn } from '../../../../shared/lib/utils';

type PanelType = 'ai' | 'media' | 'properties';

const TABS: { id: PanelType; label: string; icon: React.ReactNode }[] = [
  { id: 'ai', label: 'IA', icon: <Bot className="w-3.5 h-3.5" /> },
  { id: 'media', label: 'Mídia', icon: <Image className="w-3.5 h-3.5" /> },
  { id: 'properties', label: 'Props', icon: <Settings className="w-3.5 h-3.5" /> },
];

export function RightPanel() {
  const rightPanelType = useUIStore((s) => s.rightPanelType);
  const closeRightPanel = useUIStore((s) => s.closeRightPanel);
  const openRightPanel = useUIStore((s) => s.openRightPanel);

  const activeTab = (rightPanelType as PanelType | null) ?? 'ai';

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs */}
      <div className="flex items-center border-b border-zinc-800 shrink-0">
        <div className="flex flex-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => openRightPanel(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-amber-400 border-b-2 border-amber-500'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={closeRightPanel}
          className="px-3 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Fechar painel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'ai' && <AiChat />}
        {activeTab === 'media' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <MediaPanel />
          </div>
        )}
        {activeTab === 'properties' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <PropertiesPanel />
          </div>
        )}
      </div>
    </div>
  );
}
