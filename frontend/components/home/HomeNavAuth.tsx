'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getStoredUser } from '@/lib/auth-token';

export function HomeNavAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setIsLoggedIn(true);
      setRole(user.role);
    }
  }, []);

  if (isLoggedIn) {
    const dest = role === 'admin' ? '/admin/appeals' : '/submit';
    return (
      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25" asChild>
        <Link href={dest}>Go to App</Link>
      </Button>
    );
  }

  return (
    <>
      <Button variant="ghost" className="text-slate-300 hover:text-white" asChild>
        <Link href="/login">Sign In</Link>
      </Button>
      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25" asChild>
        <Link href="/register">Get Started</Link>
      </Button>
    </>
  );
}
