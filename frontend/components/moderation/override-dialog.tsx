'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';
import type { AdminVerdictResponse } from '@/lib/types';
import { VerdictBadge } from './verdict-badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type OverrideDialogProps = {
  verdict: AdminVerdictResponse;
  children: React.ReactNode;
};

type Outcome = 'approved' | 'flagged' | 'blocked';

export function OverrideDialog({ verdict, children }: OverrideDialogProps) {
  const token = getAccessToken();
  const queryClient = useQueryClient();
  
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [newOutcome, setNewOutcome] = useState<Outcome | null>(null);
  const [reason, setReason] = useState('');

  // Reset state when opening
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setStep('form');
      setNewOutcome(null);
      setReason('');
    }
    setOpen(newOpen);
  };

  const overrideMutation = useMutation({
    mutationFn: () =>
      apiRequest(
        `/api/admin/verdicts/${verdict.id}/override`,
        {
          method: 'PATCH',
          body: JSON.stringify({ outcome: newOutcome, reason }),
        },
        token
      ),
    onSuccess: () => {
      setOpen(false);
      toast.success('Verdict overridden successfully');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'verdicts'] });
      void queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to override verdict');
    },
  });

  const isFormValid = newOutcome !== null && reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle>Override Verdict</DialogTitle>
              <DialogDescription>
                Manually set the outcome for this image. This action is logged.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="flex flex-col items-center mb-6">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Current verdict
                </span>
                <VerdictBadge outcome={verdict.outcome} size="lg" />
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">
                  New outcome
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {(['approved', 'flagged', 'blocked'] as const).map((outcomeValue) => (
                    <div
                      key={outcomeValue}
                      onClick={() => setNewOutcome(outcomeValue)}
                      className={cn(
                        'border rounded-lg p-3 text-center cursor-pointer transition-colors',
                        newOutcome !== outcomeValue && 'border-border hover:bg-muted',
                        newOutcome === 'approved' && outcomeValue === 'approved' && 'border-2 border-verdict-approved bg-verdict-approved-bg',
                        newOutcome === 'flagged' && outcomeValue === 'flagged' && 'border-2 border-verdict-flagged bg-verdict-flagged-bg',
                        newOutcome === 'blocked' && outcomeValue === 'blocked' && 'border-2 border-verdict-blocked bg-verdict-blocked-bg'
                      )}
                    >
                      <VerdictBadge outcome={outcomeValue} size="sm" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <Label className="flex gap-1">
                  Reason for override <span className="text-verdict-blocked">*</span>
                </Label>
                <Textarea
                  rows={3}
                  className="resize-none mt-1.5"
                  placeholder="Explain why this verdict is being overridden..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button disabled={!isFormValid} onClick={() => setStep('confirm')}>
                Review Override →
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Override</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <Alert className="border-verdict-flagged/50 bg-verdict-flagged-bg/30">
                <AlertTriangle className="h-4 w-4 text-verdict-flagged" />
                <span className="text-sm font-medium ml-2 text-foreground">
                  This action is permanent and will be logged.
                </span>
              </Alert>

              <div className="mt-4 bg-muted rounded-lg p-4 flex items-center justify-between">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground uppercase">From</span>
                  <VerdictBadge outcome={verdict.outcome} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground uppercase">To</span>
                  <VerdictBadge outcome={newOutcome!} />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-sm font-medium">Reason:</span>
                <div className="bg-muted/50 rounded p-3 text-sm mt-1 border border-border">
                  {reason}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep('form')}
                disabled={overrideMutation.isPending}
              >
                ← Back
              </Button>
              <Button
                onClick={() => overrideMutation.mutate()}
                disabled={overrideMutation.isPending}
              >
                {overrideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Override
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
