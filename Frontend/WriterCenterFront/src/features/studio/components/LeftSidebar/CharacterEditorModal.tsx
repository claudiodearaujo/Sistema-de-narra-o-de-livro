import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Volume2, Loader2 } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';
import type { Character, CreateCharacterDto, UpdateCharacterDto, CharacterRole } from '../../../../shared/types/character.types';

interface CharacterEditorModalProps {
  isOpen: boolean;
  character: Character | null; // null = create mode
  bookId: string;
  onClose: () => void;
  onSave: (dto: CreateCharacterDto | UpdateCharacterDto) => Promise<void>;
  onPreviewVoice?: (voiceId: string) => Promise<void>;
  isSaving?: boolean;
  isPreviewing?: boolean;
}

interface FormData {
  name: string;
  role: CharacterRole;
  color: string;
  voiceId: string;
  description?: string;
}

const VOICE_OPTIONS = [
  { id: 'pt-BR-FranciscaNeural', label: 'Francisca (Feminino, BR)' },
  { id: 'pt-BR-AntonioNeural', label: 'Antonio (Masculino, BR)' },
  { id: 'pt-BR-BrendaNeural', label: 'Brenda (Feminino, BR)' },
  { id: 'pt-BR-DonatoNeural', label: 'Donato (Masculino, BR)' },
  { id: 'pt-BR-ElzaNeural', label: 'Elza (Feminino, BR)' },
  { id: 'pt-BR-FabioNeural', label: 'Fabio (Masculino, BR)' },
  { id: 'pt-BR-GiovannaNeural', label: 'Giovanna (Feminino, BR)' },
  { id: 'pt-BR-HumbertoNeural', label: 'Humberto (Masculino, BR)' },
  { id: 'pt-BR-JulioNeural', label: 'Julio (Masculino, BR)' },
  { id: 'pt-BR-LeilaNeural', label: 'Leila (Feminino, BR)' },
  { id: 'pt-BR-LeticiaNeural', label: 'Leticia (Feminino, BR)' },
  { id: 'pt-BR-ManuelaNeural', label: 'Manuela (Feminino, BR)' },
  { id: 'pt-BR-NicolauNeural', label: 'Nicolau (Masculino, BR)' },
  { id: 'pt-BR-ThalitaNeural', label: 'Thalita (Feminino, BR)' },
  { id: 'pt-BR-ValerioNeural', label: 'Valerio (Masculino, BR)' },
  { id: 'pt-BR-YaraNeural', label: 'Yara (Feminino, BR)' },
];

const ROLE_OPTIONS: { value: CharacterRole; label: string }[] = [
  { value: 'protagonist', label: 'Protagonista' },
  { value: 'antagonist', label: 'Antagonista' },
  { value: 'supporting', label: 'Coadjuvante' },
  { value: 'narrator', label: 'Narrador' },
];

export function CharacterEditorModal({
  isOpen,
  character,
  bookId,
  onClose,
  onSave,
  onPreviewVoice,
  isSaving = false,
  isPreviewing = false,
}: CharacterEditorModalProps) {
  const isEditMode = !!character;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      name: character?.name ?? '',
      role: character?.role ?? 'supporting',
      color: character?.color ?? '#ef4444',
      voiceId: character?.voiceId ?? 'pt-BR-FranciscaNeural',
      description: character?.description ?? '',
    },
  });

  const selectedVoiceId = watch('voiceId');

  // Reset form when character changes
  useEffect(() => {
    if (character) {
      reset({
        name: character.name,
        role: character.role,
        color: character.color,
        voiceId: character.voiceId,
        description: character.description ?? '',
      });
    } else {
      reset({
        name: '',
        role: 'supporting',
        color: '#ef4444', // Default red
        voiceId: 'pt-BR-FranciscaNeural',
        description: '',
      });
    }
  }, [character, reset]);

  const onSubmit = async (data: FormData) => {
    if (isEditMode) {
      await onSave({
        name: data.name,
        role: data.role,
        color: data.color,
        voiceId: data.voiceId,
        description: data.description || undefined,
      } as UpdateCharacterDto);
    } else {
      await onSave({
        bookId,
        name: data.name,
        role: data.role,
        color: data.color,
        voiceId: data.voiceId,
        description: data.description || undefined,
      } as CreateCharacterDto);
    }
    onClose();
  };

  const handlePreview = () => {
    if (onPreviewVoice && selectedVoiceId) {
      onPreviewVoice(selectedVoiceId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-100">
              {isEditMode ? 'Editar Personagem' : 'Novo Personagem'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1">
              Nome *
            </label>
            <input
              id="name"
              type="text"
              {...register('name', { required: 'Nome é obrigatório' })}
              className={cn(
                'w-full px-3 py-2 bg-zinc-800 border rounded text-zinc-100 placeholder-zinc-500',
                'focus:outline-none focus:border-amber-500/50',
                errors.name ? 'border-red-500' : 'border-zinc-700'
              )}
              placeholder="Ex: João Silva"
              autoFocus
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-zinc-300 mb-1">
                Papel *
              </label>
              <select
                id="role"
                {...register('role')}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-amber-500/50"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-zinc-300 mb-1">
                Cor *
              </label>
              <div className="flex gap-2 h-9.5">
                <input
                  id="color"
                  type="color"
                  {...register('color')}
                  className="h-full w-12 bg-transparent border-none cursor-pointer p-0"
                />
                <input
                  type="text"
                  {...register('color')}
                  className="flex-1 px-3 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-amber-500/50 uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Voice */}
          <div>
            <label htmlFor="voiceId" className="block text-sm font-medium text-zinc-300 mb-1">
              Voz *
            </label>
            <div className="flex gap-2">
              <select
                id="voiceId"
                {...register('voiceId', { required: 'Voz é obrigatória' })}
                className={cn(
                  'flex-1 px-3 py-2 bg-zinc-800 border rounded text-zinc-100',
                  'focus:outline-none focus:border-amber-500/50',
                  errors.voiceId ? 'border-red-500' : 'border-zinc-700'
                )}
              >
                {VOICE_OPTIONS.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handlePreview}
                disabled={isPreviewing || !onPreviewVoice}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Preview de voz"
              >
                {isPreviewing ? (
                  <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4 text-zinc-400" />
                )}
              </button>
            </div>
            {errors.voiceId && <p className="text-red-400 text-xs mt-1">{errors.voiceId.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">
              Descrição
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none"
              placeholder="Descrição opcional do personagem..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving || !isDirty}
            className="px-4 py-2 text-sm bg-amber-500 text-zinc-950 font-medium rounded hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditMode ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}
