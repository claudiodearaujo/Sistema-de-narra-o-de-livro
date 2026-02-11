import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { CreateBookDto } from '../../shared/types';

interface CreateBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBookDto) => Promise<void>;
  loading: boolean;
}

export function CreateBookDialog({ open, onOpenChange, onSubmit, loading }: CreateBookDialogProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle('');
    setAuthor('');
    setDescription('');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError('O título deve ter pelo menos 3 caracteres.');
      return;
    }

    if (!author.trim()) {
      setError('O autor é obrigatório.');
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        author: author.trim(),
        description: description.trim() || undefined,
      });
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar livro.');
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(value) => { onOpenChange(value); if (!value) resetForm(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-zinc-100">
              Novo Livro
            </Dialog.Title>
            <Dialog.Close className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-zinc-400 mb-1.5">
                Título *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="O título do seu livro"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                autoFocus
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium text-zinc-400 mb-1.5">
                Autor *
              </label>
              <input
                id="author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nome do autor"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-zinc-400 mb-1.5">
                Descrição
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uma breve descrição do livro (opcional)"
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm resize-none"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Dialog.Close
                type="button"
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                disabled={loading}
              >
                Cancelar
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando...' : 'Criar Livro'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
