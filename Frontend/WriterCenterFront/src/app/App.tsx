import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './router';
import { DebugLogPanel } from '../features/studio/components/DebugLogPanel';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors (401)
        if (error?.response?.status === 401) {
          return false;
        }
        // Retry other errors up to 1 time
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Stop all queries when unmounting to prevent loops
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      onError: (error: any) => {
        // If we get a 401, clear all queries to stop loops
        if (error?.response?.status === 401) {
          console.log('[QueryClient] Auth error detected, clearing all queries');
          queryClient.cancelQueries();
          queryClient.clear();
        }
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors (401)
        if (error?.response?.status === 401) {
          return false;
        }
        // Don't retry mutations by default
        return false;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#18181B',
            border: '1px solid #27272A',
            color: '#FAFAFA',
          },
          className: 'sonner-toast',
        }}
        closeButton
        richColors
      />
      <DebugLogPanel />
    </QueryClientProvider>
  );
}

export default App;

