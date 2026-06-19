'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppealForm } from '@/components/AppealForm';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';
import { appealStatusLabel, outcomeLabel } from '@/lib/labels';
import type { Appeal, Submission } from '@/lib/types';

function isAppealable(outcome: Submission['imageVerdicts'][number]['outcome']) {
  return outcome === 'flagged' || outcome === 'blocked';
}

export default function HistoryPage() {
  const token = getAccessToken();

  const submissionsQuery = useQuery({
    queryKey: ['submissions'],
    queryFn: () => apiRequest<Submission[]>('/api/submissions', {}, token),
    enabled: Boolean(token),
  });

  const appealsQuery = useQuery({
    queryKey: ['appeals', 'me'],
    queryFn: () => apiRequest<Appeal[]>('/api/appeals/me', {}, token),
    enabled: Boolean(token),
  });

  const appealsByVerdictId = useMemo(() => {
    const map = new Map<string, Appeal[]>();

    for (const appeal of appealsQuery.data ?? []) {
      const existing = map.get(appeal.imageVerdictId) ?? [];
      existing.push(appeal);
      map.set(appeal.imageVerdictId, existing);
    }

    return map;
  }, [appealsQuery.data]);

  if (!token) {
    return (
      <main>
        <h1>Submission history</h1>
        <p>You need to log in to view your submission history.</p>
        <Link href="/login">Go to login</Link>
      </main>
    );
  }

  if (submissionsQuery.isLoading || appealsQuery.isLoading) {
    return (
      <main>
        <h1>Submission history</h1>
        <p aria-live="polite">Loading your submissions…</p>
      </main>
    );
  }

  if (submissionsQuery.isError || appealsQuery.isError) {
    const message =
      (submissionsQuery.error instanceof Error && submissionsQuery.error.message) ||
      (appealsQuery.error instanceof Error && appealsQuery.error.message) ||
      'Failed to load history';

    return (
      <main>
        <h1>Submission history</h1>
        <p role="alert">{message}</p>
      </main>
    );
  }

  const submissions = submissionsQuery.data ?? [];

  if (!submissions.length) {
    return (
      <main>
        <h1>Submission history</h1>
        <p>No submissions yet.</p>
        <Link href="/submit">Submit images</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Submission history</h1>
      <p>
        Review past submissions and file appeals on flagged or blocked verdicts.
      </p>

      {submissions.map((submission) => (
        <section key={submission.id}>
          <h2>Submission {submission.id}</h2>
          <p>Submitted: {new Date(submission.createdAt).toLocaleString()}</p>

          {submission.imageVerdicts.map((verdict) => {
            const verdictAppeals = [...(appealsByVerdictId.get(verdict.id) ?? [])].sort(
              (left, right) =>
                new Date(right.createdAt).getTime() -
                new Date(left.createdAt).getTime(),
            );
            const pendingAppeal = verdictAppeals.find(
              (appeal) => appeal.status === 'pending',
            );
            const latestAppeal = verdictAppeals[0];
            const canAppeal = isAppealable(verdict.outcome) && !pendingAppeal;

            return (
              <article key={verdict.id}>
                <h3>{verdict.originalFilename}</h3>
                <p>
                  Outcome: <strong>{outcomeLabel(verdict.outcome)}</strong>
                </p>
                {verdict.processingError ? (
                  <p role="alert">Processing error: {verdict.processingError}</p>
                ) : null}

                {latestAppeal ? (
                  <div>
                    <p>
                      Appeal status:{' '}
                      <strong>{appealStatusLabel(latestAppeal.status)}</strong>
                    </p>
                    {latestAppeal.adminResponse ? (
                      <p>Admin response: {latestAppeal.adminResponse}</p>
                    ) : null}
                  </div>
                ) : null}

                {canAppeal ? (
                  <AppealForm
                    imageVerdictId={verdict.id}
                    originalFilename={verdict.originalFilename}
                  />
                ) : null}

                {!canAppeal && isAppealable(verdict.outcome) && pendingAppeal ? (
                  <p>Your appeal for this verdict is pending admin review.</p>
                ) : null}
              </article>
            );
          })}
        </section>
      ))}
    </main>
  );
}
