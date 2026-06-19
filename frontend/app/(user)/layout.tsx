'use client';

import { usePathname } from 'next/navigation';
import { QueryProvider } from '@/components/QueryProvider';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

// Pages that should show the "New Submission" action button in the top bar
const SHOW_NEW_SUBMISSION = ['/history', '/appeals'];

function UserLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showAction = SHOW_NEW_SUBMISSION.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  return (
    <AppShell
      title="Workspace"
      action={
        showAction ? (
          <Button size="sm" asChild>
            <Link href="/submit">
              <Plus className="h-4 w-4 mr-2" />
              New Submission
            </Link>
          </Button>
        ) : undefined
      }
    >
      {children}
    </AppShell>
  );
}

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <UserLayoutInner>{children}</UserLayoutInner>
    </QueryProvider>
  );
}
