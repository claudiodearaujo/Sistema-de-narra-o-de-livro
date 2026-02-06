import { useUIStore } from '../../../../shared/stores';
import { X, Bot, Image, Settings } from 'lucide-react';

export function RightPanel() {
  const rightPanelType = useUIStore((state) => state.rightPanelType);
  const closeRightPanel = useUIStore((state) => state.closeRightPanel);

  const getPanelTitle = () => {
    switch (rightPanelType) {
      case 'ai':
        return 'Assistente IA';
      case 'media':
        return 'Mídia';
      case 'properties':
        return 'Propriedades';
      default:
        return 'Painel';
    }
  };

  const getPanelIcon = () => {
    switch (rightPanelType) {
      case 'ai':
        return <Bot className="w-4 h-4" />;
      case 'media':
        return <Image className="w-4 h-4" />;
      case 'properties':
        return <Settings className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {getPanelIcon()}
          <span className="text-sm font-semibold text-zinc-200">{getPanelTitle()}</span>
        </div>
        <button
          onClick={closeRightPanel}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="text-center text-zinc-500 text-sm">
          {rightPanelType === 'ai' && 'Assistente IA em desenvolvimento...'}
          {rightPanelType === 'media' && 'Painel de mídia em desenvolvimento...'}
          {rightPanelType === 'properties' && 'Propriedades em desenvolvimento...'}
          {!rightPanelType && 'Selecione um painel'}
        </div>
      </div>
    </div>
  );
}
