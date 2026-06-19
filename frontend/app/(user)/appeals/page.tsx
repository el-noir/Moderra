'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';
import type { Appeal } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerdictBadge, AppealStatusTimeline } from '@/components/moderation';

// ─── Skeleton ────────────────────────────────────────────────────────────────

function AppealSkeleton() {
  return (
    <Card className="mb-3">
      <CardContent className="pt-5 flex flex-col md:flex-row gap-6">
        {/* Left */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-md shrink-0" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28 ml-auto" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        </div>
        {/* Right */}
        <div className="w-full md:w-48 md:shrink-0 space-y-3 border-t border-border md:border-t-0 pt-4 md:pt-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Appeal Card ─────────────────────────────────────────────────────────────

function AppealCard({ appeal }: { appeal: Appeal }) {
  const verdict = appeal.imageVerdict;
  const topCategory = verdict?.categoryResults?.find(
    (c) => c.classification === 'detected'
  );

  return (
    <Card className="mb-3 transition-colors hover:border-border/80">
      <CardContent className="pt-5 flex flex-col md:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Thumbnail */}
            {verdict?.imagePath ? (
              <div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-muted border border-border">
                <Image
                  src={`/api/uploads/${verdict.imagePath.split('/').pop()}`}
                  alt={verdict.originalFilename}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-md bg-muted border border-border flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground">N/A</span>
              </div>
            )}

            {/* Verdict badge */}
            {verdict && <VerdictBadge outcome={verdict.outcome} size="sm" />}

            {/* Separator + top category */}
            {topCategory && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground font-mono truncate">
                  {topCategory.category}
                </span>
              </>
            )}

            {/* Timestamp */}
            <span className="ml-auto text-xs text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(appeal.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Justification */}
          <div className="mt-3">
            <p className="text-xs text-muted-foreground font-medium mb-1.5">
              Your justification
            </p>
            <blockquote className="bg-muted rounded-md px-4 py-3 text-sm text-foreground border-l-2 border-border italic leading-relaxed">
              {appeal.justification}
            </blockquote>
          </div>

          {/* Admin response (resolved only) */}
          {appeal.adminResponse && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground font-medium mb-1.5">
                Admin response
              </p>
              <blockquote className="bg-muted rounded-md px-4 py-3 text-sm text-foreground border-l-2 border-border italic leading-relaxed">
                {appeal.adminResponse}
              </blockquote>
            </div>
          )}
        </div>

        {/* Right column — timeline */}
        <div className="w-full md:w-48 md:shrink-0 border-t border-border md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
          <AppealStatusTimeline
            status={appeal.status}
            createdAt={appeal.createdAt}
            reviewedAt={appeal.reviewedAt ?? undefined}
            adminResponse={appeal.adminResponse ?? undefined}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty States ─────────────────────────────────────────────────────────────

function PendingEmpty() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="font-medium">No pending appeals</p>
      <p className="text-sm text-muted-foreground mt-1">
        All your appeals have been reviewed
      </p>
    </div>
  );
}

function ResolvedEmpty() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="font-medium">No resolved appeals yet</p>
      <p className="text-sm text-muted-foreground mt-1">
        Appeals you file will appear here once reviewed
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AppealsPage() {
  const token = getAccessToken();

  const pendingQuery = useQuery({
    queryKey: ['appeals', 'pending'],
    queryFn: () =>
      apiRequest<Appeal[]>('/api/appeals/me', {}, token).then((all) =>
        all.filter((a) => a.status === 'pending')
      ),
    enabled: Boolean(token),
  });

  const resolvedQuery = useQuery({
    queryKey: ['appeals', 'resolved'],
    queryFn: () =>
      apiRequest<Appeal[]>('/api/appeals/me', {}, token).then((all) =>
        all.filter((a) => a.status !== 'pending')
      ),
    enabled: Boolean(token),
  });

  const pendingCount = pendingQuery.data?.length ?? 0;
  const isLoading = pendingQuery.isLoading || resolvedQuery.isLoading;

  if (!token) {
    return (
      <div className="text-center mt-20 space-y-4">
        <p className="text-muted-foreground">You need to log in to view your appeals.</p>
        <Link href="/login" className="underline text-primary text-sm">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="flex items-center gap-1.5">
            Pending
            {pendingCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 text-xs h-5 px-1.5 min-w-5 flex items-center justify-center"
              >
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {isLoading ? (
            <>
              <AppealSkeleton />
              <AppealSkeleton />
            </>
          ) : pendingQuery.data?.length === 0 ? (
            <PendingEmpty />
          ) : (
            pendingQuery.data?.map((appeal) => (
              <AppealCard key={appeal.id} appeal={appeal} />
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved">
          {isLoading ? (
            <>
              <AppealSkeleton />
              <AppealSkeleton />
            </>
          ) : resolvedQuery.data?.length === 0 ? (
            <ResolvedEmpty />
          ) : (
            resolvedQuery.data?.map((appeal) => (
              <AppealCard key={appeal.id} appeal={appeal} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
