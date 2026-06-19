import type { ReactNode } from 'react';

type TopBarProps = {
  title: string;
  action?: ReactNode;
};

export function TopBar({ title, action }: TopBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-8 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  );
}
