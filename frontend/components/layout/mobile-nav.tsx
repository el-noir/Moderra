'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Upload, Clock, MessageSquare, UserCircle, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/lib/types';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Sidebar } from './sidebar';

type MobileNavProps = {
  user?: AuthUser;
  onLogout?: () => void;
};

const userTabs = [
  { href: '/submit', label: 'Submit', icon: Upload },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/appeals', label: 'Appeals', icon: MessageSquare },
  // Account tab could link to a profile page or just be a placeholder
  { href: '/account', label: 'Account', icon: UserCircle },
];

export function MobileNav({ user, onLogout }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close sheet on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!user) return null;

  if (user.role === 'admin') {
    return (
      <div className="md:hidden flex items-center p-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-60">
            <Sidebar user={user} onLogout={onLogout} />
          </SheetContent>
        </Sheet>
        <Link href="/" className="font-semibold text-lg tracking-tight hover:opacity-80">
          Moderra
        </Link>
      </div>
    );
  }

  // User role: fixed bottom bar
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-20 pb-safe flex">
      {userTabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex-1 py-3 flex flex-col items-center gap-1 transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
