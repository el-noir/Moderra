'use client';

import { useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
};

type FetchState =
  | { kind: 'loading' }
  | { kind: 'success'; data: HealthResponse }
  | { kind: 'error'; message: string };

export function HealthCheck() {
  const [state, setState] = useState<FetchState>({ kind: 'loading' });

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      setState({
        kind: 'error',
        message: 'NEXT_PUBLIC_API_URL is not configured.',
      });
      return;
    }

    let cancelled = false;

    async function loadHealth() {
      try {
        const response = await fetch(`${apiUrl}/api/health`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as HealthResponse;

        if (!cancelled) {
          setState({ kind: 'success', data });
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          setState({ kind: 'error', message });
        }
      }
    }

    void loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === 'loading') {
    return <p aria-live="polite">Checking backend health…</p>;
  }

  if (state.kind === 'error') {
    return (
      <p role="alert">
        Backend health check failed: {state.message}
      </p>
    );
  }

  return (
    <p aria-live="polite">
      Backend health: <strong>{state.data.status}</strong>
    </p>
  );
}
