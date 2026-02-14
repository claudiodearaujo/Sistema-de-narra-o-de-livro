import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import type { Character } from '../../../../shared/types/character.types';
import type { CreateSpeechDto } from '../../../../shared/types/speech.types';
import { TagToolbar } from './TagToolbar';
import { cn } from '../../../../shared/lib/utils';

const NARRATOR_OPTION = {
  id: 'narrator',
  name: 'Narrador',
  color: '#71717A',
  avatar: 'N',
} as const;

interface NewSpeechInputProps {
  characters: Character[];
  onSave: (dto: CreateSpeechDto) => Promise<void>;
  isSaving?: boolean;
}

export function NewSpeechInput({ characters, onSave, isSaving }: NewSpeechInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(NARRATOR_OPTION.id);
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const allOptions = [NARRATOR_OPTION, ...characters.map((c) => ({ id: c.id, name: c.name, color: c.color, avatar: c.name[0] }))];
  const selected = allOptions.find((o) => o.id === selectedCharacterId) ?? NARRATOR_OPTION;

  const open = useCallback(() => {
    setExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const close = useCallback(() => {
    setExpanded(false);
    setText('');
    setSelectedCharacterId(NARRATOR_OPTION.id);
  }, []);

  const save = useCallback(async () => {
    if (!text.trim()) return;

    await onSave({
      characterId: selectedCharacterId,
      text: text.trim(),
    });

    close();
  }, [selectedCharacterId, text, onSave, close]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        save();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    },
    [save, close]
  );

  const handleInsertTag = useCallback(
    (tag: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = text.slice(0, start) + tag + text.slice(end);
      setText(newText);
      setTimeout(() => {
        textarea.selectionStart = start + tag.length;
        textarea.selectionEnd = start + tag.length;
        textarea.focus();
      }, 0);
    },
    [text]
  );

  if (!expanded) {
    return (
      <div className="border border-dashed border-zinc-700 hover:border-zinc-600 rounded-lg p-4 transition-colors">
        <button
          onClick={open}
          className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-400 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nova fala</span>
        </button>
      </div>
    );
  }

  return (
    <div className="border border-zinc-700 rounded-lg p-4 space-y-3 bg-zinc-900/30">
      {/* Character selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-500">Personagem:</span>
        {allOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSelectedCharacterId(opt.id)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-colors',
              selectedCharacterId === opt.id
                ? 'bg-zinc-700 text-zinc-200'
                : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
            )}
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ backgroundColor: opt.color }}
            >
              {opt.avatar}
            </div>
            {opt.name}
          </button>
        ))}
      </div>

      {/* SSML TagToolbar */}
      <TagToolbar onInsertTag={handleInsertTag} />

      {/* Text input */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          selectedCharacterId === 'narrator'
            ? 'Texto do narrador...'
            : `Fala de ${selected.name}...`
        }
        rows={3}
        className={cn(
          'w-full bg-zinc-800/50 border border-zinc-700 rounded-md px-3 py-2 resize-none',
          'text-zinc-200 leading-[1.8] text-[15px] placeholder:text-zinc-600',
          'focus:outline-none focus:border-amber-500/50',
          selectedCharacterId === 'narrator' && 'italic'
        )}
      />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-600">Ctrl+Enter para adicionar · Esc para cancelar</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={close}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isSaving || !text.trim()}
            className="px-3 py-1 text-xs bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-medium rounded transition-colors"
          >
            {isSaving ? 'Salvando...' : 'Adicionar fala'}
          </button>
        </div>
      </div>
    </div>
  );
}
