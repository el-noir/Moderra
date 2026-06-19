'use client';

import { QueryProvider } from '@/components/QueryProvider';
import { AppShell } from '@/components/layout/app-shell';

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <AppShell title="Workspace">
        {children}
      </AppShell>
    </QueryProvider>
  );
}
