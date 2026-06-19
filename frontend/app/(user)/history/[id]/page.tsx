'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';
import type { Submission, Appeal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  VerdictBadge,
  CategoryRow,
  PolicyCategoryRow,
  AppealStatusTimeline,
} from '@/components/moderation';

export default function VerdictDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = getAccessToken();
  const queryClient = useQueryClient();
  const [justification, setJustification] = useState('');

  // Unpack params since Next.js 15+ treats params as a Promise
  const { id: submissionId } = use(params);
  const verdictId = searchParams.get('v');

  const { data: submission, isLoading, isError } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () =>
      apiRequest<Submission>(`/api/submissions/${submissionId}`, {}, token),
    enabled: Boolean(token),
  });

  const { data: appeals } = useQuery({
    queryKey: ['appeals', 'me'],
    queryFn: () => apiRequest<Appeal[]>('/api/appeals/me', {}, token),
    enabled: Boolean(token),
  });

  const verdict = submission?.imageVerdicts.find(
    (v) => (verdictId ? v.id === verdictId : true) // default to first if no ID
  );

  const appealMutation = useMutation({
    mutationFn: async (appealData: { imageVerdictId: string; justification: string }) => {
      return apiRequest<Appeal>(
        '/api/appeals',
        {
          method: 'POST',
          body: JSON.stringify(appealData),
        },
        token
      );
    },
    onSuccess: () => {
      toast.success('Appeal submitted');
      queryClient.invalidateQueries({ queryKey: ['appeals', 'me'] });
      setJustification('');
    },
    onError: () => {
      toast.error('Failed to submit appeal');
    },
  });

  if (!token) return null;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !submission || !verdict) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-destructive font-medium mb-4">Failed to load verdict details.</p>
        <Button variant="outline" asChild>
          <Link href="/history">Back to History</Link>
        </Button>
      </div>
    );
  }

  const existingAppeals = appeals?.filter((a) => a.imageVerdictId === verdict.id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) ?? [];
  const latestAppeal = existingAppeals[0];

  // Assuming `verdict.policySnapshot` has the categories list. (If not, we render empty for now)
  const snapshotCategories = (verdict as any).policySnapshot?.categories ?? [];
  const triggeredCategories = verdict.categoryResults?.filter(c => c.classification === 'detected') ?? [];
  const clearCategories = verdict.categoryResults?.filter(c => c.classification === 'not_detected') ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <Button variant="ghost" size="sm" className="-ml-2 mb-6" asChild>
        <Link href="/history">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to History
        </Link>
      </Button>

      {/* Image Hero */}
      <div className="bg-card rounded-xl overflow-hidden border border-border">
        {verdict.imagePath ? (
          <div className="relative w-full h-[320px] bg-muted/30">
            <Image
              src={`/api/uploads/${verdict.imagePath.split('/').pop()}`}
              alt={verdict.originalFilename}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-[320px] bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Image unavailable</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 px-1">
        <VerdictBadge outcome={verdict.outcome} size="lg" />
        <span className="text-xs text-muted-foreground font-mono">
          Policy v? · {verdict.categoryResults?.length ?? 0} categories evaluated
        </span>
      </div>

      <Separator className="my-6" />

      {/* Category Breakdown */}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
          AI Analysis
        </h2>

        {verdict.processingError ? (
          <p className="text-destructive text-sm font-medium">{verdict.processingError}</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {triggeredCategories.map((cat) => (
                <CategoryRow
                  key={cat.category}
                  category={cat.category}
                  classification={cat.classification as 'detected' | 'not_detected'}
                  confidenceScore={cat.confidenceScore}
                  reasoning={cat.reasoning}
                  threshold={80} // Extracted from snapshot if available
                  enforcement="auto_block" // Extracted from snapshot if available
                />
              ))}
            </div>

            {triggeredCategories.length > 0 && clearCategories.length > 0 && (
              <div className="relative py-4">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">
                  Below threshold
                </span>
              </div>
            )}

            <div className="space-y-2">
              {clearCategories.map((cat) => (
                <CategoryRow
                  key={cat.category}
                  category={cat.category}
                  classification={cat.classification as 'detected' | 'not_detected'}
                  confidenceScore={cat.confidenceScore}
                  reasoning={cat.reasoning}
                  threshold={80}
                  enforcement="flag_for_review"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Policy Snapshot */}
      <Collapsible className="mt-8">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between group">
            Policy snapshot (v?)
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="bg-muted/50 rounded-lg p-4 mt-2 space-y-2 border border-border">
            {snapshotCategories.length > 0 ? (
              snapshotCategories.map((sc: any) => (
                <PolicyCategoryRow
                  key={sc.name}
                  category={sc}
                  disabled={true}
                />
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No snapshot details available.</p>
            )}
            <p className="text-xs text-muted-foreground mt-3 flex justify-center italic">
              These were the active settings when this image was submitted.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Appeal Section */}
      {(verdict.outcome === 'flagged' || verdict.outcome === 'blocked') && (
        <div className="mt-6">
          {latestAppeal ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Appeal Status</CardTitle>
              </CardHeader>
              <CardContent>
                <AppealStatusTimeline
                  status={latestAppeal.status}
                  createdAt={latestAppeal.createdAt}
                  reviewedAt={latestAppeal.reviewedAt ?? undefined}
                  adminResponse={latestAppeal.adminResponse ?? undefined}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!justification.trim()) return;
                  appealMutation.mutate({
                    imageVerdictId: verdict.id,
                    justification: justification.trim(),
                  });
                }}
              >
                <CardHeader>
                  <CardTitle className="text-lg">Dispute this verdict</CardTitle>
                  <CardDescription>
                    Explain why you believe the AI verdict is incorrect. An admin will review your case.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Describe why this verdict should be reconsidered..."
                    rows={3}
                    className="resize-none"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    disabled={appealMutation.isPending}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={!justification.trim() || appealMutation.isPending}>
                    {appealMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Appeal'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
