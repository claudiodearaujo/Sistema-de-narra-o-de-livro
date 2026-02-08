import { BookOpen } from 'lucide-react';

/**
 * Book selector page - allows user to select which book to work on
 */
export function BookSelectorPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Livrya Writer's Studio</h1>
            <p className="text-xs text-zinc-500">Selecione um livro para começar</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
          <h2 className="text-2xl font-semibold text-zinc-300 mb-2">
            Seus Livros
          </h2>
          <p className="text-zinc-500 mb-8">
            Carregando seus livros...
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
