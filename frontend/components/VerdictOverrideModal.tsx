'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ImageVerdict } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface Props {
  verdict: ImageVerdict;
}

export function VerdictOverrideModal({ verdict }: Props) {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<string>(verdict.outcome);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const overrideMutation = useMutation({
    mutationFn: async (data: { outcome: string; reason: string }) => {
      const token = getAccessToken();
      return apiRequest<ImageVerdict>(
        `/api/admin/verdicts/${verdict.id}/override`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verdicts'] });
      setOpen(false);
      setReason('');
      toast({
        title: 'Verdict Overridden',
        description: `The verdict has been overridden to ${outcome}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to override verdict.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for overriding this verdict.',
        variant: 'destructive',
      });
      return;
    }
    overrideMutation.mutate({ outcome, reason });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Override
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override Verdict</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">New Outcome</label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Reason</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you overriding this verdict?"
              rows={4}
            />
          </div>
          <Button type="submit" disabled={overrideMutation.isPending}>
            {overrideMutation.isPending ? 'Saving...' : 'Confirm Override'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
