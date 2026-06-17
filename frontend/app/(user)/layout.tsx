'use client';

import { QueryProvider } from '@/components/QueryProvider';

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <QueryProvider>{children}</QueryProvider>;
}
