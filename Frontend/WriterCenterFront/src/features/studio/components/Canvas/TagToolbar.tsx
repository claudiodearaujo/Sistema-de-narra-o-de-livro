import { PauseCircle, Zap, TrendingUp, TrendingDown, Wind, Bold, Italic } from 'lucide-react';

interface TagToolbarProps {
  onInsertTag: (tag: string) => void;
}

interface TagButton {
  icon: React.ReactNode;
  label: string;
  tag: string;
  title: string;
}

const TAG_BUTTONS: TagButton[] = [
  {
    icon: <PauseCircle className="w-3.5 h-3.5" />,
    label: 'Pausa',
    tag: '<break time="500ms"/>',
    title: 'Inserir pausa de 500ms',
  },
  {
    icon: <Zap className="w-3.5 h-3.5" />,
    label: 'Ênfase',
    tag: '<emphasis level="moderate"> </emphasis>',
    title: 'Inserir ênfase',
  },
  {
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    label: 'Tom+',
    tag: '<prosody pitch="+2st"> </prosody>',
    title: 'Tom mais alto',
  },
  {
    icon: <TrendingDown className="w-3.5 h-3.5" />,
    label: 'Tom-',
    tag: '<prosody pitch="-2st"> </prosody>',
    title: 'Tom mais baixo',
  },
  {
    icon: <Wind className="w-3.5 h-3.5" />,
    label: 'Sussurro',
    tag: '<amazon:effect name="whispered"> </amazon:effect>',
    title: 'Voz sussurrada',
  },
  {
    icon: <Bold className="w-3.5 h-3.5" />,
    label: 'Forte',
    tag: '<prosody volume="loud"> </prosody>',
    title: 'Volume alto',
  },
  {
    icon: <Italic className="w-3.5 h-3.5" />,
    label: 'Suave',
    tag: '<prosody volume="soft"> </prosody>',
    title: 'Volume suave',
  },
];

export function TagToolbar({ onInsertTag }: TagToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-1 py-1 bg-zinc-900 border border-zinc-700 rounded-md">
      {TAG_BUTTONS.map((btn) => (
        <button
          key={btn.label}
          type="button"
          onClick={() => onInsertTag(btn.tag)}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          title={btn.title}
        >
          {btn.icon}
          <span className="hidden sm:inline">{btn.label}</span>
        </button>
      ))}
    </div>
  );
}
