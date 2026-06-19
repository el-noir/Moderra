'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { TopBar } from './top-bar';
import { getStoredUser, clearAccessToken } from '@/lib/auth-token';
import type { AuthUser } from '@/lib/types';

type AppShellProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, action, children }: AppShellProps) {
  const [user, setUser] = useState<AuthUser | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    clearAccessToken();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex flex-col shrink-0 h-full">
        <Sidebar user={user} onLogout={handleLogout} />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {/* Admin mobile top bar */}
        {user.role === 'admin' && (
          <MobileNav user={user} onLogout={handleLogout} />
        )}
        
        <TopBar title={title} action={action} />
        
        <main className="px-4 md:px-8 py-6 max-w-7xl mx-auto w-full flex-1 mb-16 md:mb-0">
          {children}
        </main>
        
        {/* User mobile bottom bar */}
        {user.role !== 'admin' && (
          <MobileNav user={user} onLogout={handleLogout} />
        )}
      </div>
    </div>
  );
}
