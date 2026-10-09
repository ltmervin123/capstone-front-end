import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Refetch data when window regains focus
      staleTime: 1000 * 60 * 1, // 1 minute: data is considered fresh; no refetch on page remount
      gcTime: 1000 * 60 * 5, // Keep unused data in cache for 5 minutes
    },
  },
});
      <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
