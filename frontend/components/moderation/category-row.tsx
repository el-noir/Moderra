import { cn } from '@/lib/utils';
import { ConfidenceBar } from './confidence-bar';
import { Badge } from '@/components/ui/badge';

type Props = {
  category: string;
  classification: 'detected' | 'not_detected';
  confidenceScore: number;
  reasoning: string;
  threshold: number;
  enforcement: 'auto_block' | 'flag_for_review';
};

export function CategoryRow({
  category,
  classification,
  confidenceScore,
  reasoning, // currently unused in this basic view, but could be put in a tooltip later
  threshold,
  enforcement,
}: Props) {
  const triggered =
    confidenceScore >= threshold && classification === 'detected';

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row items-start md:items-center gap-4 px-4 py-3 rounded-md transition-colors w-full',
        'hover:bg-muted/50',
        triggered && enforcement === 'auto_block' && 'bg-verdict-blocked-bg/60',
        triggered &&
          enforcement === 'flag_for_review' &&
          'bg-verdict-flagged-bg/60'
      )}
    >
      {/* Category name */}
      <span className="w-full md:w-44 shrink-0 text-sm font-medium text-foreground truncate">
        {category}
      </span>

      {/* Classification chip */}
      <Badge
        variant="outline"
        className={cn(
          'shrink-0 font-mono text-[10px] w-24 justify-center',
          classification === 'detected'
            ? 'border-verdict-blocked/40 text-verdict-blocked bg-verdict-blocked-bg/40'
            : 'border-muted text-muted-foreground'
        )}
      >
        {classification === 'detected' ? 'DETECTED' : 'CLEAR'}
      </Badge>

      {/* Confidence bar */}
      <div className="w-full md:flex-1 pt-4 pb-1">
        <ConfidenceBar
          score={confidenceScore}
          threshold={threshold}
          enforcement={enforcement}
        />
      </div>

      {/* Enforcement tag */}
      <span
        className={cn(
          'shrink-0 font-mono text-[10px] text-muted-foreground w-full md:w-20 text-left md:text-right',
          triggered && enforcement === 'auto_block' && 'text-verdict-blocked',
          triggered &&
            enforcement === 'flag_for_review' &&
            'text-verdict-flagged'
        )}
      >
        {enforcement === 'auto_block' ? 'AUTO BLOCK' : 'REVIEW'}
      </span>
    </div>
  );
}
