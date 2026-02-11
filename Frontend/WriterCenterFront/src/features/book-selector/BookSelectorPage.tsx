import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { http, endpoints } from '../../shared/api';
import { useAuthStore } from '../../shared/stores';
import type { Book, BooksResponse, CreateBookDto } from '../../shared/types';
import { CreateBookDialog } from './CreateBookDialog';

/**
 * Book selector page - allows user to select which book to work on
 */
export function BookSelectorPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await http.get<BooksResponse>(endpoints.books.list, {
        params: { page: 1, limit: 50 },
      });
      setBooks(response.data.data);
    } catch (err) {
      console.error('Failed to fetch books:', err);
      setError('Não foi possível carregar seus livros. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  async function handleCreateBook(data: CreateBookDto) {
    setCreating(true);
    try {
      const response = await http.post(endpoints.books.list, data);
      const newBook: Book = response.data;
      setBooks((prev) => [newBook, ...prev]);
      setShowCreateDialog(false);
      navigate(`/book/${newBook.id}`);
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Erro ao criar livro. Tente novamente.';
      throw new Error(message);
    } finally {
      setCreating(false);
    }
  }

  function handleSelectBook(bookId: string) {
    navigate(`/book/${bookId}`);
  }

  function handleLogout() {
    logout();
    window.location.href = '/';
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Livrya Writer's Studio</h1>
              <p className="text-xs text-zinc-500">
                {user?.name ? `Bem-vindo, ${user.name}` : 'Selecione um livro para começar'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Novo Livro
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {loading && (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4"></div>
              <p className="text-zinc-500">Carregando seus livros...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-zinc-400 mb-4">{error}</p>
              <button
                onClick={fetchBooks}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 transition-colors text-sm mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
            </div>
          </div>
        )}

        {!loading && !error && books.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
              <h2 className="text-xl font-semibold text-zinc-300 mb-2">
                Nenhum livro ainda
              </h2>
              <p className="text-zinc-500 mb-6">
                Crie seu primeiro livro para começar a escrever no Writer's Studio.
              </p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors text-sm font-medium mx-auto"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Livro
              </button>
            </div>
          </div>
        )}

        {!loading && !error && books.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-zinc-200 mb-6">
              Seus Livros ({books.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleSelectBook(book.id)}
                  className="group text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/70 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-14 h-20 rounded-md object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-20 rounded-md bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-zinc-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors truncate">
                        {book.title}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-0.5">{book.author}</p>
                      {book.description && (
                        <p className="text-xs text-zinc-600 mt-1.5 line-clamp-2">
                          {book.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                        {book.chapters && (
                          <span>
                            {book.chapters.length}{' '}
                            {book.chapters.length === 1 ? 'capítulo' : 'capítulos'}
                          </span>
                        )}
                        <span>{formatDate(book.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      <CreateBookDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateBook}
        loading={creating}
      />
    </div>
  );
}
