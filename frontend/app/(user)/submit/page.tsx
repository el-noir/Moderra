'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';
import type { Submission } from '@/lib/types';

function outcomeLabel(outcome: Submission['imageVerdicts'][number]['outcome']) {
  switch (outcome) {
    case 'approved':
      return 'Approved';
    case 'flagged':
      return 'Flagged for Review';
    case 'blocked':
      return 'Blocked';
    default:
      return outcome;
  }
}

export default function SubmitPage() {
  const token = getAccessToken();
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<Submission | null>(null);

  const submitMutation = useMutation({
    mutationFn: async (selectedFiles: File[]) => {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('images', file));

      return apiRequest<Submission>(
        '/api/submissions',
        {
          method: 'POST',
          body: formData,
        },
        token,
      );
    },
    onSuccess: (submission) => {
      setResult(submission);
    },
  });

  const fileLabel = useMemo(() => {
    if (!files.length) {
      return 'No files selected';
    }

    return files.map((file) => file.name).join(', ');
  }, [files]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!files.length) {
      return;
    }

    submitMutation.mutate(files);
  }

  if (!token) {
    return (
      <main>
        <h1>Submit images</h1>
        <p>You need to log in before submitting images.</p>
        <Link href="/login">Go to login</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Submit images</h1>
      <p>Upload one or more images for moderation. Each image receives its own verdict.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="images">Images</label>
          <input
            id="images"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(event) =>
              setFiles(Array.from(event.target.files ?? []))
            }
          />
          <p>{fileLabel}</p>
        </div>
        <button type="submit" disabled={!files.length || submitMutation.isPending}>
          {submitMutation.isPending ? 'Submitting…' : 'Submit for moderation'}
        </button>
      </form>

      {submitMutation.isError ? (
        <p role="alert">
          {submitMutation.error instanceof Error
            ? submitMutation.error.message
            : 'Submission failed'}
        </p>
      ) : null}

      {result ? (
        <section aria-live="polite">
          <h2>Submission result</h2>
          <p>Submission ID: {result.id}</p>
          {result.imageVerdicts.map((verdict) => (
            <article key={verdict.id}>
              <h3>{verdict.originalFilename}</h3>
              <p>
                Outcome: <strong>{outcomeLabel(verdict.outcome)}</strong>
              </p>
              {verdict.processingError ? (
                <p role="alert">Processing error: {verdict.processingError}</p>
              ) : null}
              {verdict.categoryResults.length ? (
                <table>
                  <caption>Per-category breakdown</caption>
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col">Classification</th>
                      <th scope="col">Confidence</th>
                      <th scope="col">Reasoning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verdict.categoryResults.map((categoryResult) => (
                      <tr key={`${verdict.id}-${categoryResult.category}`}>
                        <td>{categoryResult.category}</td>
                        <td>{categoryResult.classification}</td>
                        <td>{categoryResult.confidenceScore}</td>
                        <td>{categoryResult.reasoning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No category results (moderation may have failed for this image).</p>
              )}
            </article>
          ))}
        </section>
      ) : null}

      {!result && !submitMutation.isPending && !submitMutation.isError ? (
        <p>No submission yet. Upload images to see verdicts here.</p>
      ) : null}
    </main>
  );
}
