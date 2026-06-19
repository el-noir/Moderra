'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { getAccessToken, getStoredUser } from '@/lib/auth-token';
import { appealStatusLabel, outcomeLabel } from '@/lib/labels';
import type { Appeal, AppealDecision } from '@/lib/types';

type ResolveState = {
  appealId: string;
  decision: AppealDecision;
};

export default function AdminAppealsPage() {
  const token = getAccessToken();
  const user = getStoredUser();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'pending' | 'accepted' | 'rejected'>(
    'pending',
  );
  const [adminResponses, setAdminResponses] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<ResolveState | null>(null);
  const [mutationError, setMutationError] = useState<{ appealId: string; message: string } | null>(null);

  const appealsQuery = useQuery({
    queryKey: ['admin', 'appeals', statusFilter],
    queryFn: () =>
      apiRequest<Appeal[]>(
        `/api/admin/appeals?status=${statusFilter}`,
        {},
        token,
      ),
    enabled: Boolean(token) && user?.role === 'admin',
  });

  const resolveMutation = useMutation({
    mutationFn: ({ appealId, decision }: ResolveState) =>
      apiRequest<Appeal>(
        `/api/admin/appeals/${appealId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            decision,
            adminResponse: adminResponses[appealId]?.trim() || undefined,
          }),
        },
        token,
      ),
    onMutate: (variables) => {
      setResolving(variables);
      setMutationError(null);
    },
    onSettled: () => {
      setResolving(null);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'appeals'] });
    },
    onError: (err: Error, variables) => {
      setMutationError({
        appealId: variables.appealId,
        message: err.message || 'Failed to resolve appeal',
      });
    },
  });

  function handleResolve(appealId: string, decision: AppealDecision) {
    resolveMutation.mutate({ appealId, decision });
  }

  if (!token || user?.role !== 'admin') {
    return (
      <main>
        <h1>Appeals queue</h1>
        <p>Admin access is required to review appeals.</p>
        <Link href="/login">Go to login</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Appeals queue</h1>
      <p>Review user appeals and accept or reject with an optional written response.</p>

      <div>
        <label htmlFor="status-filter">Filter by status</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as typeof statusFilter)
          }
        >
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {appealsQuery.isLoading ? (
        <p aria-live="polite">Loading appeals…</p>
      ) : null}

      {appealsQuery.isError ? (
        <p role="alert">
          {appealsQuery.error instanceof Error
            ? appealsQuery.error.message
            : 'Failed to load appeals'}
        </p>
      ) : null}

      {appealsQuery.isSuccess && !appealsQuery.data.length ? (
        <p>No {statusFilter} appeals found.</p>
      ) : null}

      {appealsQuery.data?.map((appeal) => (
        <article key={appeal.id}>
          <h2>
            {appeal.imageVerdict?.originalFilename ?? 'Unknown image'} —{' '}
            {appealStatusLabel(appeal.status)}
          </h2>
          <p>Appeal ID: {appeal.id}</p>
          <p>User: {appeal.user?.email ?? appeal.userId}</p>
          <p>
            Verdict outcome:{' '}
            <strong>
              {outcomeLabel(appeal.imageVerdict?.outcome ?? 'unknown')}
            </strong>
          </p>
          <p>Justification: {appeal.justification}</p>
          {appeal.adminResponse ? (
            <p>Admin response: {appeal.adminResponse}</p>
          ) : null}
          {appeal.reviewedAt ? (
            <p>Reviewed: {new Date(appeal.reviewedAt).toLocaleString()}</p>
          ) : null}

          {appeal.status === 'pending' ? (
            <div>
              <div>
                <label htmlFor={`admin-response-${appeal.id}`}>
                  Admin response (optional)
                </label>
                <textarea
                  id={`admin-response-${appeal.id}`}
                  value={adminResponses[appeal.id] ?? ''}
                  onChange={(event) =>
                    setAdminResponses((current) => ({
                      ...current,
                      [appeal.id]: event.target.value,
                    }))
                  }
                  rows={3}
                  maxLength={2000}
                />
              </div>
              <div>
                <button
                  type="button"
                  disabled={resolveMutation.isPending}
                  onClick={() => handleResolve(appeal.id, 'accepted')}
                >
                  {resolveMutation.isPending &&
                  resolving?.appealId === appeal.id &&
                  resolving.decision === 'accepted'
                    ? 'Accepting…'
                    : 'Accept appeal'}
                </button>{' '}
                <button
                  type="button"
                  disabled={resolveMutation.isPending}
                  onClick={() => handleResolve(appeal.id, 'rejected')}
                >
                  {resolveMutation.isPending &&
                  resolving?.appealId === appeal.id &&
                  resolving.decision === 'rejected'
                    ? 'Rejecting…'
                    : 'Reject appeal'}
                </button>
              </div>
              {(resolveMutation.isError || mutationError?.appealId === appeal.id) &&
              mutationError?.appealId === appeal.id ? (
                <p role="alert">
                  {mutationError.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </article>
      ))}
    </main>
  );
}
