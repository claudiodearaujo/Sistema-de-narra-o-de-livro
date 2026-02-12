import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthGuard } from '../auth/AuthGuard';
import { AuthCallback } from '../auth/AuthCallback';

const BookSelectorPage = lazy(() => import('../features/book-selector/BookSelectorPage').then(m => ({ default: m.BookSelectorPage })));
const StudioPage = lazy(() => import('../features/studio/StudioPage').then(m => ({ default: m.StudioPage })));
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));

const Loading = () => (
  <div className="flex h-screen items-center justify-center bg-zinc-950">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    path: '/dashboard',
    element: <AuthGuard />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<Loading />}><DashboardPage /></Suspense>,
      },
    ],
  },
  {
    path: '/',
    element: <AuthGuard />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<Loading />}><BookSelectorPage /></Suspense>,
      },
      {
        path: 'book/:bookId',
        element: <Suspense fallback={<Loading />}><StudioPage /></Suspense>,
      },
      {
        path: 'book/:bookId/chapter/:chapterId',
        element: <Suspense fallback={<Loading />}><StudioPage /></Suspense>,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
