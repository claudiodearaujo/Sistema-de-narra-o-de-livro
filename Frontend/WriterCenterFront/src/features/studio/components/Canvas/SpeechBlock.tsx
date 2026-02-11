import { useRef, useCallback, KeyboardEvent } from 'react';
import { Mic, Image, Music, Wand2, MoreHorizontal, Check, Loader2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useSpeechActions } from '../../hooks/useSpeechActions';
import type { Speech } from '../../../../shared/types/speech.types';
import type { Character } from '../../../../shared/types/character.types';
import { TagToolbar } from './TagToolbar';
import { AudioPlayer } from './AudioPlayer';
import { SceneImage } from './SceneImage';
import { cn } from '../../../../shared/lib/utils';
import type { SpeechNarrationProgress } from '../../../../shared/hooks/useNarration';

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
  narrationProgress?: SpeechNarrationProgress;
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
  narrationProgress,
}: SpeechBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const actions = useSpeechActions();

  // Derived state from both local optimistics and server events
  const isGeneratingAudio = narrationProgress?.status === 'processing' || actions.generateAudio.isPending;
  const audioProgress = narrationProgress?.progress ?? 0;
  const hasAudioError = narrationProgress?.status === 'failed' || actions.generateAudio.isError;
  
  const effectiveAudioUrl = speech.audioUrl || narrationProgress?.audioUrl;
  const showPlayer = !!effectiveAudioUrl && (speech.hasAudio || narrationProgress?.status === 'completed');

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
          'absolute -left-6 top-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer',
          isSelected && 'opacity-100'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(speech.id);
        }}
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
          {/* Audio Player or Progress */}
          {showPlayer ? (
             <div className="relative group/audio">
               <AudioPlayer audioUrl={effectiveAudioUrl!} />
             </div>
          ) : isGeneratingAudio ? (
            <div className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded border border-zinc-700/50 w-full max-w-sm">
              <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />
              <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(5, audioProgress)}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-mono shrink-0 w-8 text-right">{audioProgress}%</span>
            </div>
          ) : hasAudioError ? (
             <div className="text-xs text-red-400 p-2 bg-red-500/10 border border-red-500/20 rounded">
               Erro ao gerar áudio. Tente novamente.
             </div>
          ) : null}

          {speech.hasImage && speech.imageUrl && (
            <SceneImage imageUrl={speech.imageUrl} alt={`Cena: ${speech.text.slice(0, 50)}...`} />
          )}
        </div>
      )}

      {/* Quick actions on hover (non-editing) */}
      {!isEditing && (
        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
          <SpeechActionButton
            icon={Mic}
            label={isGeneratingAudio ? "Gerando..." : "Gerar narração"}
            onClick={() => actions.generateAudio.mutate(speech.id)}
            isLoading={isGeneratingAudio}
            active={speech.hasAudio}
          />
          <SpeechActionButton
            icon={Image}
            label="Gerar imagem"
            onClick={() => actions.generateSceneImage.mutate(speech.id)}
            isLoading={actions.generateSceneImage.isPending}
            active={speech.hasImage}
          />
          <SpeechActionButton
            icon={Music}
            label="Gerar ambiente"
            onClick={() => actions.generateAmbientAudio.mutate(speech.id)}
            isLoading={actions.generateAmbientAudio.isPending}
            active={speech.hasAmbientAudio}
          />
          <SpeechActionButton
            icon={Wand2}
            label="Assistente IA"
            onClick={() => actions.openAiTools(speech.id)}
          />

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="p-1.5 rounded transition-all duration-200 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                title="Mais opções"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-50 min-w-[180px] rounded-md border border-zinc-700 bg-zinc-900 p-1 shadow-xl"
              >
                <DropdownMenu.Item
                  onSelect={() => actions.openAiTools(speech.id)}
                  className="cursor-pointer rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800 outline-none"
                >
                  Abrir no Assistente IA
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => actions.duplicateSpeech.mutate(speech)}
                  className="cursor-pointer rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800 outline-none"
                >
                  Duplicar fala
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-zinc-700" />
                <DropdownMenu.Item
                  onSelect={() => {
                    if (window.confirm('Tem certeza que deseja excluir esta fala?')) {
                      actions.deleteSpeech.mutate(speech);
                    }
                  }}
                  className="cursor-pointer rounded px-2 py-1.5 text-xs text-red-400 hover:bg-zinc-800 focus:bg-zinc-800 outline-none"
                >
                  Excluir fala
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}
    </div>
  );
}

interface SpeechActionButtonProps {
  icon: typeof Mic;
  label: string;
  onClick: () => void;
  isLoading?: boolean;
  active?: boolean;
}

function SpeechActionButton({ icon: Icon, label, onClick, isLoading, active }: SpeechActionButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={isLoading}
      className={cn(
        "p-1.5 rounded transition-all duration-200",
        active 
          ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20" 
          : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800",
        isLoading && "opacity-70 cursor-not-allowed"
      )}
      title={label}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Icon className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
