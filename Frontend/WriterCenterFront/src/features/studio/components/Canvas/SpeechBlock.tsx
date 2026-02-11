import { useRef, useCallback, KeyboardEvent } from 'react';
import { Mic, Image, Music, Wand2, MoreHorizontal, Check } from 'lucide-react';
import type { Speech } from '../../../../shared/types/speech.types';
import type { Character } from '../../../../shared/types/character.types';
import { TagToolbar } from './TagToolbar';
import { AudioPlayer } from './AudioPlayer';
import { SceneImage } from './SceneImage';
import { cn } from '../../../../shared/lib/utils';

interface SpeechBlockProps {
  speech: Speech;
  character: Character | null; // null = Narrador
  isEditing: boolean;
  editingText: string;
  isSelected: boolean;
  onStartEdit: (speechId: string, text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onUpdateText: (text: string) => void;
  onToggleSelect: (speechId: string) => void;
}

const NARRATOR_COLOR = '#71717A'; // zinc-500

export function SpeechBlock({
  speech,
  character,
  isEditing,
  editingText,
  isSelected,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onUpdateText,
  onToggleSelect,
}: SpeechBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isNarrator = !character || speech.characterId === 'narrator';
  const color = isNarrator ? NARRATOR_COLOR : character?.color ?? NARRATOR_COLOR;

  const handleTextClick = useCallback(() => {
    if (!isEditing) {
      onStartEdit(speech.id, speech.text);
      // Focus textarea after state update
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [isEditing, speech.id, speech.text, onStartEdit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSaveEdit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelEdit();
      }
    },
    [onSaveEdit, onCancelEdit]
  );

  const handleInsertTag = useCallback(
    (tag: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = editingText.slice(0, start) + tag + editingText.slice(end);
      onUpdateText(newText);
      // Restore cursor position after tag
      setTimeout(() => {
        textarea.selectionStart = start + tag.length;
        textarea.selectionEnd = start + tag.length;
        textarea.focus();
      }, 0);
    },
    [editingText, onUpdateText]
  );

  return (
    <div
      className={cn(
        'group relative rounded-lg transition-colors',
        isNarrator ? 'px-4 py-3' : 'border-l-2 px-4 py-3 pl-5',
        isSelected && 'bg-amber-500/5 ring-1 ring-amber-500/20',
        !isSelected && !isEditing && 'hover:bg-zinc-900/50'
      )}
      style={isNarrator ? undefined : { borderLeftColor: color }}
    >
      {/* Checkbox on hover */}
      <div
        className={cn(
          'absolute left-[-24px] top-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer',
          isSelected && 'opacity-100'
        )}
        onClick={() => onToggleSelect(speech.id)}
      >
        <div
          className={cn(
            'w-4 h-4 rounded border flex items-center justify-center',
            isSelected
              ? 'bg-amber-500 border-amber-500'
              : 'border-zinc-600 hover:border-zinc-400'
          )}
        >
          {isSelected && <Check className="w-2.5 h-2.5 text-zinc-950" />}
        </div>
      </div>

      {/* Character header (non-narrator) */}
      {!isNarrator && (
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: color }}
          >
            {character?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="text-sm font-medium" style={{ color }}>
            {character?.name ?? 'Personagem'}
          </span>
          {speech.emotion && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 italic">
              {speech.emotion}
            </span>
          )}
          {/* Media indicators */}
          <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            {speech.hasAudio && <Mic className="w-3 h-3 text-emerald-500" />}
            {speech.hasImage && <Image className="w-3 h-3 text-blue-400" />}
            {speech.hasAmbientAudio && <Music className="w-3 h-3 text-purple-400" />}
          </div>
        </div>
      )}

      {/* Narrator media indicators */}
      {isNarrator && (speech.hasAudio || speech.hasImage || speech.hasAmbientAudio) && (
        <div className="flex items-center gap-1 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {speech.hasAudio && <Mic className="w-3 h-3 text-emerald-500" />}
          {speech.hasImage && <Image className="w-3 h-3 text-blue-400" />}
          {speech.hasAmbientAudio && <Music className="w-3 h-3 text-purple-400" />}
        </div>
      )}

      {/* Text content or editor */}
      {isEditing ? (
        <div className="space-y-2">
          <TagToolbar onInsertTag={handleInsertTag} />
          <textarea
            ref={textareaRef}
            value={editingText}
            onChange={(e) => onUpdateText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            rows={4}
            className={cn(
              'w-full bg-zinc-800/50 border border-zinc-700 rounded-md px-3 py-2 resize-none',
              'text-zinc-200 leading-[1.8] text-[15px] focus:outline-none focus:border-amber-500/50',
              isNarrator && 'italic'
            )}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-600">Ctrl+Enter para salvar · Esc para cancelar</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                className="px-3 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium rounded transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'leading-[1.85] text-[15px] cursor-text select-text',
            isNarrator ? 'text-zinc-400 italic' : 'text-zinc-200'
          )}
          onClick={handleTextClick}
          title="Clique para editar"
        >
          {speech.text || <span className="text-zinc-600 italic">Fala vazia — clique para editar</span>}
        </div>
      )}

      {/* Media Content (Audio Player & Scene Image) */}
      {!isEditing && (
        <div className="mt-3 space-y-2">
          {speech.hasAudio && speech.audioUrl && (
            <AudioPlayer audioUrl={speech.audioUrl} />
          )}
          {speech.hasImage && speech.imageUrl && (
            <SceneImage imageUrl={speech.imageUrl} alt={`Cena: ${speech.text.slice(0, 50)}...`} />
          )}
        </div>
      )}

      {/* Quick actions on hover (non-editing) */}
      {!isEditing && (
        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            title="Gerar narração TTS"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            title="Gerar imagem da cena"
          >
            <Image className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            title="Ferramentas IA"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            title="Mais opções"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
