import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type VerdictOutcome = 'approved' | 'flagged' | 'blocked' | 'pending';

const config: Record<
  VerdictOutcome,
  {
    dot: string;
    label: string;
    classes: string;
  }
> = {
  approved: {
    dot: 'bg-verdict-approved',
    label: 'APPROVED',
    classes: 'bg-verdict-approved-bg border-verdict-approved-border text-verdict-approved',
  },
  flagged: {
    dot: 'bg-verdict-flagged',
    label: 'FLAGGED',
    classes: 'bg-verdict-flagged-bg border-verdict-flagged-border text-verdict-flagged',
  },
  blocked: {
    dot: 'bg-verdict-blocked',
    label: 'BLOCKED',
    classes: 'bg-verdict-blocked-bg border-verdict-blocked-border text-verdict-blocked',
  },
  pending: {
    dot: 'bg-primary',
    label: 'PENDING',
    classes: 'bg-primary/10 border-primary/30 text-primary',
  },
};

const sizes = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

const dotSizes = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

type Props = {
  outcome: VerdictOutcome;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function VerdictBadge({ outcome, size = 'md', className }: Props) {
  const { dot, label, classes } = config[outcome];
  return (
    <Badge
      variant="outline"
      aria-label={`Verdict: ${outcome}`}
      className={cn(
        'font-mono font-semibold tracking-wider border transition-colors duration-300',
        classes,
        sizes[size],
        className
      )}
    >
      <span
        className={cn('rounded-full shrink-0', dot, dotSizes[size])}
        aria-hidden
      />
      <span>{label}</span>
    </Badge>
  );
}
