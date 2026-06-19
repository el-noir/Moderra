'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { QueryProvider } from '@/components/QueryProvider';
import { getAccessToken, getStoredUser, isAdminUser } from '@/lib/auth-token';

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

  return <QueryProvider>{children}</QueryProvider>;
}
