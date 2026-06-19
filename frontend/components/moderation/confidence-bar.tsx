import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Props = {
  score: number; // 0-100
  threshold: number; // from policy snapshot
  enforcement: 'auto_block' | 'flag_for_review';
  animated?: boolean;
};

export function ConfidenceBar({
  score,
  threshold,
  enforcement,
  animated = true,
}: Props) {
  const triggered = score >= threshold;
  const fillColor = !triggered
    ? 'bg-muted-foreground/30'
    : enforcement === 'auto_block'
      ? 'bg-verdict-blocked'
      : 'bg-verdict-flagged';

  const thresholdPct = `${threshold}%`;
  const tooltipText = `Score: ${score} / Threshold: ${threshold} — ${
    triggered
      ? `triggered (${enforcement === 'auto_block' ? 'auto block' : 'flag for review'})`
      : 'below threshold'
  }`;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative w-full group">
            {/* Track */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              {/* Fill */}
              <div
                className={cn(
                  'h-full rounded-full',
                  fillColor,
                  animated && 'motion-safe:animate-confidence-fill'
                )}
                style={
                  {
                    width: animated ? undefined : `${score}%`,
                    '--target-width': `${score}%`,
                  } as React.CSSProperties
                }
                role="progressbar"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={tooltipText}
              />
            </div>

            {/* Threshold tick */}
            <div
              className="absolute top-0 h-1.5 w-0.5 bg-foreground/40 rounded-full"
              style={{ left: thresholdPct }}
              aria-hidden
            />

            {/* Threshold label */}
            <span
              className="absolute -top-4 font-mono text-[10px] text-muted-foreground -translate-x-1/2 select-none"
              style={{ left: thresholdPct }}
              aria-hidden
            >
              {threshold}
            </span>

            {/* Score label */}
            <span
              className={cn(
                'absolute right-0 -top-4 font-mono text-[10px]',
                triggered
                  ? enforcement === 'auto_block'
                    ? 'text-verdict-blocked'
                    : 'text-verdict-flagged'
                  : 'text-muted-foreground'
              )}
            >
              {score}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
