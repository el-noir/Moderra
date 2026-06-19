import Link from 'next/link';
import { HealthCheck } from '@/components/HealthCheck';

export default function HomePage() {
  return (
    <main>
      <h1>AI Content Moderation Platform</h1>
      <p>Phase 6 — submit images, review history, and file appeals on disputed verdicts.</p>
      <p>
        <Link href="/login">Log in</Link> then{' '}
        <Link href="/submit">submit images</Link> or view{' '}
        <Link href="/history">your history</Link>.
      </p>
      <HealthCheck />
    </main>
  );
}
