'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';
import type { PolicyVersion, PolicyCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PolicyResponse = { activeVersion: PolicyVersion; history: PolicyVersion[] };

export default function AdminPolicyPage() {
  const token = getAccessToken();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [draftCategories, setDraftCategories] = useState<PolicyCategory[] | null>(null);

  const { data: policyData, isLoading, isError, error } = useQuery({
    queryKey: ['admin-policy'],
    queryFn: () =>
      apiRequest<PolicyResponse>('/api/admin/policy', {}, token),
    enabled: Boolean(token),
  });

  // Initialise draft when data first loads — in effect, not during render
  useEffect(() => {
    if (policyData && draftCategories === null) {
      setDraftCategories(policyData.activeVersion.categories);
    }
  }, [policyData, draftCategories]);

  const saveMutation = useMutation({
    mutationFn: (categories: PolicyCategory[]) =>
      apiRequest<PolicyVersion>('/api/admin/policy', {
        method: 'PUT',
        body: JSON.stringify({ categories }),
      }, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-policy'] });
      setDraftCategories(null); // will be re-init from fresh data via useEffect
      toast({ title: 'Policy Updated', description: 'New policy version created.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleUpdateCategory = (index: number, changes: Partial<PolicyCategory>) => {
    if (!draftCategories) return;
    const newDraft = [...draftCategories];
    newDraft[index] = { ...newDraft[index], ...changes };
    setDraftCategories(newDraft);
  };

  const handleSave = () => {
    if (!draftCategories) return;
    saveMutation.mutate(draftCategories);
  };

  if (isLoading) {
    return <p aria-live="polite">Loading policy…</p>;
  }

  if (isError) {
    return (
      <p role="alert" className="text-destructive">
        {error instanceof Error ? error.message : 'Failed to load policy.'}
      </p>
    );
  }

  if (!policyData) {
    return <p className="text-muted-foreground">No policy data available.</p>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Policy Configuration</h1>
        <Button onClick={handleSave} disabled={saveMutation.isPending || !draftCategories}>
          {saveMutation.isPending ? 'Saving…' : 'Save New Version'}
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Categories</h2>
        {draftCategories === null ? (
          <p className="text-muted-foreground">Preparing editor…</p>
        ) : (
          draftCategories.map((cat, idx) => (
            <Card key={cat.name}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{cat.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={cat.enabled}
                      onCheckedChange={(c) => handleUpdateCategory(idx, { enabled: c })}
                    />
                    <Label>{cat.enabled ? 'Enabled' : 'Disabled'}</Label>
                  </div>
                </div>
              </CardHeader>
              {cat.enabled && (
                <CardContent className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Confidence Threshold: {cat.confidenceThreshold}%</Label>
                    </div>
                    <Slider
                      value={[cat.confidenceThreshold]}
                      max={100}
                      step={1}
                      onValueChange={([val]) =>
                        handleUpdateCategory(idx, { confidenceThreshold: val })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Enforcement Action</Label>
                    <RadioGroup
                      value={cat.enforcement}
                      onValueChange={(v: PolicyCategory['enforcement']) =>
                        handleUpdateCategory(idx, { enforcement: v })
                      }
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="flag_for_review" id={`flag-${idx}`} />
                        <Label htmlFor={`flag-${idx}`}>Flag for Review</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="auto_block" id={`block-${idx}`} />
                        <Label htmlFor={`block-${idx}`}>Auto Block</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Version History</h2>
        <div className="space-y-2">
          {policyData.history.length === 0 ? (
            <p className="text-muted-foreground">No previous versions.</p>
          ) : (
            policyData.history.map((v) => (
              <div key={v.id} className="p-3 border rounded flex justify-between bg-muted/50">
                <span>Version {v.version}</span>
                <span className="text-muted-foreground">
                  {new Date(v.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
