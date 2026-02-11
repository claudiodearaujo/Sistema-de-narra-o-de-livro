import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { useStudioStore } from '../../../../shared/stores';
import { useChapter, useUpdateChapter } from '../../../../shared/hooks/useChapters';
import type { Chapter } from '../../../../shared/types/chapter.types';
import { cn } from '../../../../shared/lib/utils';

interface FormValues {
  title: string;
  status: Chapter['status'];
  notes: string;
}

const STATUS_OPTIONS: { value: Chapter['status']; label: string }[] = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluído' },
];

export function PropertiesPanel() {
  const activeChapterId = useStudioStore((s) => s.activeChapterId);
  const { data: chapter, isLoading } = useChapter(activeChapterId);
  const updateChapter = useUpdateChapter();

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<FormValues>({
    defaultValues: { title: '', status: 'draft', notes: '' },
  });

  useEffect(() => {
    if (chapter) {
      reset({ title: chapter.title, status: chapter.status, notes: '' });
    }
  }, [chapter, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!activeChapterId) return;
    await updateChapter.mutateAsync({
      id: activeChapterId,
      dto: { title: values.title, status: values.status },
    });
    reset(values); // Clear dirty state
  };

  if (!activeChapterId) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-zinc-600">Selecione um capítulo para ver as propriedades.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Título do capítulo</label>
        <input
          {...register('title', { required: true })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Status</label>
        <select
          {...register('status')}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Notas do autor</label>
        <textarea
          {...register('notes')}
          placeholder="Anotações privadas sobre este capítulo..."
          rows={4}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!isDirty || updateChapter.isPending}
        className={cn(
          'w-full py-2 rounded-md text-sm font-medium transition-colors',
          isDirty && !updateChapter.isPending
            ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
        )}
      >
        {updateChapter.isPending ? 'Salvando...' : isDirty ? 'Salvar alterações' : 'Sem alterações'}
      </button>
    </form>
  );
}
