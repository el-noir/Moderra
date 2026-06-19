import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Inter, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'AI Content Moderation Platform',
  description: 'Image moderation and appeals platform',
};

import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans dark", inter.variable, mono.variable)}>
      <body>
        <nav>
          <Link href="/">Home</Link> | <Link href="/login">Login</Link> |{' '}
          <Link href="/submit">Submit</Link> | <Link href="/history">History</Link>{' '}
          | <Link href="/admin/appeals">Admin appeals</Link>{' '}
          | <Link href="/admin/verdicts">Admin verdicts</Link>{' '}
          | <Link href="/admin/policy">Admin policy</Link>{' '}
          | <Link href="/admin/analytics">Admin analytics</Link>
        </nav>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
