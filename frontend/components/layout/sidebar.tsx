'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Upload,
  Clock,
  MessageSquare,
  Inbox,
  Shield,
  Settings,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { AuthUser } from '@/lib/types';

type SidebarProps = {
  user?: AuthUser;
  onLogout?: () => void;
};

const workspaceLinks = [
  { href: '/submit', label: 'Submit', icon: Upload },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/appeals', label: 'My Appeals', icon: MessageSquare },
];

const adminLinks = [
  { href: '/admin/queue', label: 'Appeals Queue', icon: Inbox },
  { href: '/admin/verdicts', label: 'Verdicts', icon: Shield },
  { href: '/admin/policy', label: 'Policy', icon: Settings },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const renderLink = (link: { href: string; label: string; icon: any }) => {
    // Exact match for base paths, startsWith match for nested paths
    const isActive =
      pathname === link.href || (pathname.startsWith(`${link.href}/`) && link.href !== '/');
    const Icon = link.icon;

    return (
      <div
        key={link.href}
        className={cn(isActive && 'border-l-2 border-l-primary -ml-px')}
      >
        <Link
          href={link.href}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
            isActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{link.label}</span>
        </Link>
      </div>
    );
  };

  return (
    <aside className="flex flex-col w-60 h-full bg-card border-r border-border shrink-0">
      <div className="flex items-center gap-2 p-6">
        <span className="font-semibold text-lg text-foreground tracking-tight">
          ModerateAI
        </span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          BETA
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-6">
        <div className="px-3">
          <h2 className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-3 mb-1">
            Workspace
          </h2>
          <div className="space-y-1">{workspaceLinks.map(renderLink)}</div>
        </div>

        {user?.role === 'admin' && (
          <div className="px-3">
            <h2 className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-3 mb-1">
              Administration
            </h2>
            <div className="space-y-1">{adminLinks.map(renderLink)}</div>
          </div>
        )}
      </div>

      {user && (
        <div className="p-4 mt-auto">
          <Separator className="mb-4" />
          <div className="flex items-center gap-3 px-2 mb-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user.email}</span>
              <div>
                <Badge
                  variant={user.role === 'admin' ? 'default' : 'outline'}
                  className={cn('text-[10px] uppercase')}
                >
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </Button>
        </div>
      )}
    </aside>
  );
}
