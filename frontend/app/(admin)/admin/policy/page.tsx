'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';
import { PolicyVersion, PolicyCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPolicyPage() {
  const token = getAccessToken();
  const toast = useToast().toast;
  const queryClient = useQueryClient();
  
  const [draftCategories, setDraftCategories] = useState<PolicyCategory[] | null>(null);

  const { data: policyData, isLoading } = useQuery({
    queryKey: ['admin-policy'],
    queryFn: async () => {
      return apiRequest<{ activeVersion: PolicyVersion; history: PolicyVersion[] }>(
        '/api/admin/policy',
        {},
        token
      );
    },
    enabled: Boolean(token),
  });

  // Initialize draft when data loads
  if (policyData && draftCategories === null) {
    setDraftCategories(policyData.activeVersion.categories);
  }

  const saveMutation = useMutation({
    mutationFn: async (categories: PolicyCategory[]) => {
      return apiRequest<any>(
        '/api/admin/policy',
        {
          method: 'PUT',
          body: JSON.stringify({ categories }),
        },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-policy'] });
      toast({ title: 'Policy Updated', description: 'New policy version created.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
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

  if (isLoading) return <p>Loading policy...</p>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Policy Configuration</h1>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving...' : 'Save New Version'}
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Categories</h2>
        {draftCategories?.map((cat, idx) => (
          <Card key={cat.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{cat.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={cat.enabled} 
                    onCheckedChange={(c) => handleUpdateCategory(idx, { enabled: c })} 
                  />
                  <Label>Enabled</Label>
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
                    onValueChange={([val]) => handleUpdateCategory(idx, { confidenceThreshold: val })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Enforcement Action</Label>
                  <RadioGroup 
                    value={cat.enforcement} 
                    onValueChange={(v: any) => handleUpdateCategory(idx, { enforcement: v })}
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
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Version History</h2>
        <div className="space-y-2">
          {policyData?.history.map((v) => (
            <div key={v.id} className="p-3 border rounded flex justify-between bg-muted/50">
              <span>Version {v.version}</span>
              <span className="text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</span>
            </div>
          ))}
          {policyData?.history.length === 0 && (
            <p className="text-muted-foreground">No previous versions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
