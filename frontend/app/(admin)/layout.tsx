'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { QueryProvider } from '@/components/QueryProvider';
import { getAccessToken, getStoredUser, isAdminUser } from '@/lib/auth-token';
import { AppShell } from '@/components/layout/app-shell';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    const user = getStoredUser();

    if (!token) {
      router.replace('/login');
      return;
    }

    if (!user || !isAdminUser()) {
      router.replace('/submit');
    }
  }, [router]);

  return (
    <QueryProvider>
      <AppShell title="Administration">
        {children}
      </AppShell>
    </QueryProvider>
  );
}
