import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Content Moderation Platform',
  description: 'Image moderation and appeals platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/">Home</Link> | <Link href="/login">Login</Link> |{' '}
          <Link href="/submit">Submit</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
