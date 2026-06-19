'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';
import type { Appeal } from '@/lib/types';

const MIN_JUSTIFICATION_LENGTH = 10;

type AppealFormProps = {
  imageVerdictId: string;
  originalFilename: string;
};

export function AppealForm({ imageVerdictId, originalFilename }: AppealFormProps) {
  const token = getAccessToken();
  const queryClient = useQueryClient();
  const [justification, setJustification] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const appealMutation = useMutation({
    mutationFn: async (text: string) =>
      apiRequest<Appeal>(
        '/api/appeals',
        {
          method: 'POST',
          body: JSON.stringify({
            imageVerdictId,
            justification: text,
          }),
        },
        token,
      ),
    onSuccess: () => {
      setJustification('');
      setValidationError(null);
      void queryClient.invalidateQueries({ queryKey: ['appeals', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = justification.trim();

    if (trimmed.length < MIN_JUSTIFICATION_LENGTH) {
      setValidationError(
        `Justification must be at least ${MIN_JUSTIFICATION_LENGTH} characters.`,
      );
      return;
    }

    setValidationError(null);
    appealMutation.mutate(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} aria-label={`Appeal verdict for ${originalFilename}`}>
      <h4>File an appeal</h4>
      <div>
        <label htmlFor={`justification-${imageVerdictId}`}>Justification</label>
        <textarea
          id={`justification-${imageVerdictId}`}
          value={justification}
          onChange={(event) => setJustification(event.target.value)}
          rows={4}
          required
          minLength={MIN_JUSTIFICATION_LENGTH}
          maxLength={2000}
        />
      </div>
      {validationError ? <p role="alert">{validationError}</p> : null}
      {appealMutation.isError ? (
        <p role="alert">
          {appealMutation.error instanceof Error
            ? appealMutation.error.message
            : 'Failed to file appeal'}
        </p>
      ) : null}
      {appealMutation.isSuccess ? (
        <p role="status">Appeal submitted and pending admin review.</p>
      ) : null}
      <button type="submit" disabled={appealMutation.isPending}>
        {appealMutation.isPending ? 'Submitting appeal…' : 'Submit appeal'}
      </button>
    </form>
  );
}
