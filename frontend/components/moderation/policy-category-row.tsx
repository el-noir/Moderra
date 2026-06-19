import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type PolicyCategory = {
  name: string;
  enabled: boolean;
  confidenceThreshold: number;
  enforcement: 'auto_block' | 'flag_for_review';
};

type Props = {
  category: PolicyCategory;
  modified: boolean;
  onChange: (updated: PolicyCategory) => void;
};

export function PolicyCategoryRow({ category, modified, onChange }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3 rounded-md border transition-all',
        'border-border bg-card',
        !category.enabled && 'opacity-50',
        modified && 'border-l-2 border-l-primary'
      )}
    >
      {/* Toggle */}
      <Switch
        checked={category.enabled}
        onCheckedChange={(v) => onChange({ ...category, enabled: v })}
        aria-label={`Enable ${category.name}`}
      />

      {/* Name */}
      <Label className="w-44 shrink-0 font-medium text-sm cursor-default">
        {category.name}
      </Label>

      {/* Threshold input */}
      <div className="flex items-center gap-2 shrink-0">
        <Label className="text-xs text-muted-foreground">Threshold</Label>
        <Input
          type="number"
          min={0}
          max={100}
          value={category.confidenceThreshold}
          disabled={!category.enabled}
          onChange={(e) =>
            onChange({
              ...category,
              confidenceThreshold: Number(e.target.value),
            })
          }
          className="w-16 font-mono text-sm text-center h-8"
        />
      </div>

      {/* Enforcement — segmented control built from two styled buttons */}
      <div
        className={cn(
          'flex rounded-md border border-border overflow-hidden shrink-0',
          !category.enabled && 'pointer-events-none'
        )}
      >
        {(['flag_for_review', 'auto_block'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onChange({ ...category, enforcement: mode })}
            className={cn(
              'px-3 py-1 text-xs font-mono transition-colors',
              category.enforcement === mode
                ? mode === 'auto_block'
                  ? 'bg-verdict-blocked-bg text-verdict-blocked border-l-2 border-l-verdict-blocked'
                  : 'bg-verdict-flagged-bg text-verdict-flagged border-l-2 border-l-verdict-flagged'
                : 'bg-transparent text-muted-foreground hover:bg-muted'
            )}
          >
            {mode === 'auto_block' ? 'Auto Block' : 'Flag for Review'}
          </button>
        ))}
      </div>

      {/* Modified indicator */}
      {modified && (
        <span className="ml-auto text-[10px] font-mono text-primary">
          modified
        </span>
      )}
    </div>
  );
}
