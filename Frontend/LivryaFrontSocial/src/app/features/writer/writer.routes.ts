import { Routes } from '@angular/router';

// Lazy load components from existing features (will be moved to writer/ subfolder)
const loadDashboard = () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent);
const loadBookList = () => import('./pages/books/book-list/book-list.component').then(m => m.BookListComponent);
const loadBookForm = () => import('./pages/books/book-form/book-form.component').then(m => m.BookFormComponent);
const loadBookDetail = () => import('./pages/books/book-detail/book-detail.component').then(m => m.BookDetailComponent);
const loadChapterDetail = () => import('./pages/chapters/chapter-detail/chapter-detail.component').then(m => m.ChapterDetailComponent);
const loadCharacterList = () => import('./pages/characters/character-list/character-list.component').then(m => m.CharacterListComponent);
const loadVoiceList = () => import('./pages/voices/voice-list/voice-list.component').then(m => m.VoiceListComponent);
/**
 * Writer Module Routes
 * All routes for the "Área do Escritor" module
 */
export const WRITER_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Área do Escritor | Dashboard',
    loadComponent: loadDashboard
  },
  {
    path: 'books',
    title: 'Meus Livros',
    loadComponent: loadBookList
  },
  {
    path: 'books/new',
    title: 'Novo Livro',
    loadComponent: loadBookForm
  },
  {
    path: 'books/:id',
    title: 'Detalhes do Livro',
    loadComponent: loadBookDetail
  },
  {
    path: 'books/:id/edit',
    title: 'Editar Livro',
    loadComponent: loadBookForm
  },
  {
    path: 'books/:id/characters',
    title: 'Personagens do Livro',
    loadComponent: loadCharacterList
  },
  {
    path: 'chapters/:id',
    title: 'Capítulo',
    loadComponent: loadChapterDetail
  },
  {
    path: 'characters',
    title: 'Personagens',
    loadComponent: loadCharacterList
  },
  {
    path: 'voices',
    title: 'Vozes',
    loadComponent: loadVoiceList
  }
];
