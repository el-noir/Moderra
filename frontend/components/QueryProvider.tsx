'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { clearAccessToken } from '@/lib/auth-token';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      }),
  );

  // Global error handler: auto-logout on 401 (expired / invalid token)
  queryClient.getQueryCache().config.onError = (error) => {
    if (error instanceof ApiError && error.status === 401) {
      clearAccessToken();
      window.location.replace('/login');
    }
  };

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
