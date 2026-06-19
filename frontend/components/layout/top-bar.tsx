import type { ReactNode } from 'react';

type TopBarProps = {
  title: string;
  titleSuffix?: ReactNode;
  action?: ReactNode;
};

export function TopBar({ title, titleSuffix, action }: TopBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {titleSuffix}
      </div>
      <div id="top-bar-action-slot" className="flex items-center gap-3">
        {action}
      </div>
    </div>
  );
}
