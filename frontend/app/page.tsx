import Link from 'next/link';
import { HealthCheck } from '@/components/HealthCheck';

export default function HomePage() {
  return (
    <main>
      <h1>AI Content Moderation Platform</h1>
      <p>Phase 5 — submit images for per-image AI moderation verdicts.</p>
      <p>
        <Link href="/login">Log in</Link> then <Link href="/submit">submit images</Link>.
      </p>
      <HealthCheck />
    </main>
  );
}
