import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type Props = {
  createdAt: string | Date;
  status: 'pending' | 'accepted' | 'rejected';
  reviewedAt?: string | Date;
  adminResponse?: string;
};

const steps = ['Filed', 'Under Review', 'Resolved'] as const;

export function AppealStatusTimeline({
  createdAt,
  status,
  reviewedAt,
  adminResponse,
}: Props) {
  const activeStep = status === 'pending' ? 1 : 2;

  return (
    <div className="flex flex-col gap-0">
      {steps.map((label, i) => {
        const done = i < activeStep;
        const active = i === activeStep;
        const future = i > activeStep;

        return (
          <div key={label} className="flex gap-3">
            {/* Node + connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-4 w-4 rounded-full border-2 shrink-0 transition-colors',
                  done && 'bg-primary border-primary',
                  active && 'bg-background border-primary',
                  future && 'bg-background border-border',
                  i === 2 &&
                    status === 'accepted' &&
                    'border-verdict-approved bg-verdict-approved',
                  i === 2 &&
                    status === 'rejected' &&
                    'border-verdict-blocked bg-verdict-blocked'
                )}
              />
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-4',
                    done ? 'bg-primary' : 'bg-border border-dashed'
                  )}
                />
              )}
            </div>

            {/* Label + timestamp */}
            <div className="pb-4 pt-0.5">
              <p
                className={cn(
                  'text-sm font-medium',
                  future ? 'text-muted-foreground' : 'text-foreground'
                )}
              >
                {label}
              </p>
              {i === 0 && (
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {formatDistanceToNow(new Date(createdAt), {
                    addSuffix: true,
                  })}
                </p>
              )}
              {i === 2 && reviewedAt && (
                <>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {formatDistanceToNow(new Date(reviewedAt), {
                      addSuffix: true,
                    })}
                  </p>
                  {adminResponse && (
                    <blockquote className="mt-2 border-l-2 border-border pl-3 text-xs text-muted-foreground italic">
                      {adminResponse}
                    </blockquote>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
