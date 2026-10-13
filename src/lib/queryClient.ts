import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Refetch data when window regains focus
      staleTime: 1000 * 60 * 1, // 1 minute: data is considered fresh; no refetch on page remount
      gcTime: 1000 * 60 * 5, // Keep unused data in cache for 5 minutes
    },
  },
});

/**
 * Clears feature query and mutation caches in React Query while preserving
 * the active auth session query so session handshakes are not disrupted.
 * Pass `includeAuthSession = true` to force-clear everything including auth.
 */
export function clearAppQueryCache(includeAuthSession = false): void {
  if (includeAuthSession) {
    queryClient.clear();
  } else {
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'auth',
    });
  }
}


// Expose queryClient on window for browser inspection and automated test assertions
if (typeof window !== 'undefined') {
  (window as unknown as { __REACT_QUERY_CLIENT__?: QueryClient }).__REACT_QUERY_CLIENT__ = queryClient;
}
