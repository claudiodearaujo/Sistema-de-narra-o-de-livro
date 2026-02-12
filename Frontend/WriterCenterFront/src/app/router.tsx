import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from '../auth/AuthGuard';
import { AuthCallback } from '../auth/AuthCallback';
import { BookSelectorPage } from '../features/book-selector/BookSelectorPage';
import { StudioPage } from '../features/studio/StudioPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';

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
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: '/',
    element: <AuthGuard />,
    children: [
      {
        index: true,
        element: <BookSelectorPage />,
      },
      {
        path: 'book/:bookId',
        element: <StudioPage />,
      },
      {
        path: 'book/:bookId/chapter/:chapterId',
        element: <StudioPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
