'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, CalendarIcon, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getAccessToken, getStoredUser } from '@/lib/auth-token';
import type { Appeal, AppealDecision } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { VerdictBadge } from '@/components/moderation';

// ─── Debounce hook ──────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function AppealCardSkeleton() {
  return (
    <Card className="mb-3">
      <CardContent className="pt-5 grid grid-cols-[80px_1fr] gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-20 rounded-md" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-16 w-full rounded-md" />
          <div className="flex gap-3">
            <Skeleton className="h-16 flex-1 rounded-md" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Appeal Card ─────────────────────────────────────────────────────────────

type AppealCardProps = {
  appeal: Appeal;
  onResolve: (appealId: string, decision: AppealDecision, adminResponse: string) => void;
  isPending: boolean;
  focused: boolean;
  onFocus: () => void;
  acceptDialogOpen: boolean;
  onAcceptDialogChange: (open: boolean) => void;
};

function AppealCard({
  appeal,
  onResolve,
  isPending,
  focused,
  onFocus,
  acceptDialogOpen,
  onAcceptDialogChange,
}: AppealCardProps) {
  const [adminResponse, setAdminResponse] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [rejectFlash, setRejectFlash] = useState(false);
  const verdict = appeal.imageVerdict;
  const topCategory = verdict?.categoryResults?.find((c) => c.classification === 'detected');
  const imageUrl = verdict?.imagePath
    ? `/api/uploads/${verdict.imagePath.split('/').pop()}`
    : null;

  const handleReject = () => {
    setRejectFlash(true);
    setTimeout(() => setRejectFlash(false), 600);
    onResolve(appeal.id, 'rejected', adminResponse);
  };

  const handleAccept = () => {
    onResolve(appeal.id, 'accepted', adminResponse);
    onAcceptDialogChange(false);
  };

  return (
    <>
      {/* Image lightbox dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl p-2 bg-card">
          <DialogTitle className="sr-only">{verdict?.originalFilename ?? 'Image preview'}</DialogTitle>
          {imageUrl ? (
            <div className="relative w-full h-[70vh]">
              <Image src={imageUrl} alt={verdict?.originalFilename ?? 'Appeal image'} fill className="object-contain" />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">No image available</div>
          )}
        </DialogContent>
      </Dialog>

      <Card
        id={`appeal-${appeal.id}`}
        tabIndex={-1}
        onClick={onFocus}
        className={cn(
          'mb-3 transition-all duration-200 outline-none',
          focused && 'ring-2 ring-ring ring-offset-2',
          rejectFlash && 'bg-yellow-500/10 border-yellow-500/50'
        )}
      >
        <CardContent className="pt-5 grid grid-cols-[80px_1fr] gap-6">
          {/* Left: image + badge */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
              className="relative h-20 w-20 rounded-md overflow-hidden bg-muted border border-border cursor-pointer hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="View full image"
            >
              {imageUrl ? (
                <Image src={imageUrl} alt={verdict?.originalFilename ?? 'Appeal image'} fill className="object-cover" />
              ) : (
                <span className="text-[10px] text-muted-foreground flex items-center justify-center h-full">N/A</span>
              )}
            </button>
            {verdict && <VerdictBadge outcome={verdict.outcome} size="sm" />}
          </div>

          {/* Right: content */}
          <div>
            {/* Row 1: user + timestamp */}
            <div className="flex flex-col md:flex-row md:justify-between items-start gap-1 md:gap-4">
              <div>
                <span className="font-medium text-sm">{appeal.user?.email ?? appeal.userId}</span>
                <span className="text-xs text-muted-foreground font-mono md:ml-2 block md:inline">
                  · Submitted {formatDistanceToNow(new Date(appeal.createdAt), { addSuffix: true })}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono shrink-0">
                {format(new Date(appeal.createdAt), 'MMM d, yyyy HH:mm')}
              </span>
            </div>

            {/* Row 2: top category + enforcement */}
            {topCategory && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{topCategory.category}</span>
                <span className="font-mono text-muted-foreground/60">
                  {(topCategory.confidenceScore * 100).toFixed(0)}%
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-mono uppercase px-1.5 py-0',
                    topCategory.classification === 'detected' && 'border-verdict-blocked text-verdict-blocked'
                  )}
                >
                  {/* enforcement comes from policy snapshot — use category result classification as proxy */}
                  REVIEW
                </Badge>
              </div>
            )}

            {/* Row 3: justification */}
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Justification
              </p>
              <div className="bg-muted rounded-md px-3 py-2 text-sm leading-relaxed">
                {appeal.justification}
              </div>
            </div>

            {/* Row 4: actions (only for pending) */}
            {appeal.status === 'pending' && (
              <div className="mt-4 flex items-start gap-3">
                <Textarea
                  placeholder="Admin response (optional)..."
                  rows={2}
                  className="resize-none flex-1 text-sm"
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  disabled={isPending}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex flex-col gap-2 shrink-0">
                  {/* Accept with AlertDialog */}
                  <AlertDialog open={acceptDialogOpen} onOpenChange={onAcceptDialogChange}>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Accept'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Accept this appeal?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The verdict will be changed to Approved. This action will be logged.
                      </AlertDialogDescription>
                      <div className="flex justify-end gap-3 mt-4">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAccept}>
                          Accept appeal
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Reject (no confirm) */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={(e) => { e.stopPropagation(); handleReject(); }}
                    className="border-verdict-blocked text-verdict-blocked hover:bg-verdict-blocked/10"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {/* Resolved state */}
            {appeal.status !== 'pending' && appeal.adminResponse && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Admin response</p>
                <div className="bg-muted rounded-md px-3 py-2 text-sm italic leading-relaxed">
                  {appeal.adminResponse}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type StatusFilter = 'pending' | 'accepted' | 'rejected' | 'all';

export default function AdminAppealsPage() {
  const token = getAccessToken();
  const user = getStoredUser();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [acceptDialogIndex, setAcceptDialogIndex] = useState<number>(-1);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const debouncedSearch = useDebounce(searchInput, 300);

  const queryParams = new URLSearchParams();
  if (statusFilter !== 'all') queryParams.set('status', statusFilter);
  if (debouncedSearch) queryParams.set('email', debouncedSearch);
  if (dateFrom) queryParams.set('dateFrom', dateFrom.toISOString());
  if (dateTo) queryParams.set('dateTo', dateTo.toISOString());

  const { data: appeals, isLoading } = useQuery({
    queryKey: ['admin', 'appeals', statusFilter, debouncedSearch, dateFrom, dateTo],
    queryFn: () =>
      apiRequest<Appeal[]>(`/api/admin/appeals?${queryParams.toString()}`, {}, token),
    enabled: Boolean(token) && user?.role === 'admin',
  });

  // Pending count for badge — always fetches pending regardless of filter
  const { data: pendingAppeals } = useQuery({
    queryKey: ['admin', 'appeals', 'pending'],
    queryFn: () => apiRequest<Appeal[]>('/api/admin/appeals?status=pending', {}, token),
    enabled: Boolean(token) && user?.role === 'admin',
  });
  const pendingCount = pendingAppeals?.length ?? 0;

  const visibleAppeals = (appeals ?? []).filter((a) => !dismissedIds.has(a.id));

  const resolveMutation = useMutation({
    mutationFn: ({ appealId, decision, adminResponse }: { appealId: string; decision: AppealDecision; adminResponse: string }) =>
      apiRequest<Appeal>(
        `/api/admin/appeals/${appealId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ decision, adminResponse: adminResponse.trim() || undefined }),
        },
        token,
      ),
    onSuccess: (_, variables) => {
      if (variables.decision === 'accepted') {
        toast.success('Appeal accepted — verdict updated to Approved');
      } else {
        toast.info('Appeal rejected');
      }
      // Invalidate all relevant query keys
      void queryClient.invalidateQueries({ queryKey: ['admin', 'appeals'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'verdicts'] });
      void queryClient.invalidateQueries({ queryKey: ['appeals'] });
      // Fade-out: add to dismissed set
      setTimeout(() => {
        setDismissedIds((prev) => new Set([...prev, variables.appealId]));
      }, 300);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to resolve appeal');
    },
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const inTextField =
        active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement;
      if (inTextField) return;

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, visibleAppeals.length - 1));
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < visibleAppeals.length) {
          const focused = visibleAppeals[focusedIndex];
          if (focused.status === 'pending') setAcceptDialogIndex(focusedIndex);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < visibleAppeals.length) {
          const focused = visibleAppeals[focusedIndex];
          if (focused.status === 'pending') {
            resolveMutation.mutate({ appealId: focused.id, decision: 'rejected', adminResponse: '' });
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visibleAppeals, focusedIndex, resolveMutation]);

  // Scroll focused card into view
  useEffect(() => {
    if (focusedIndex < 0 || focusedIndex >= visibleAppeals.length) return;
    const el = document.getElementById(`appeal-${visibleAppeals[focusedIndex].id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el?.focus();
  }, [focusedIndex, visibleAppeals]);

  if (!token || user?.role !== 'admin') return null;

  return (
    <>
      {/* Pending count badge is injected via the AppShell titleSuffix — done from layout level.
          Since layout is static, we inject it here as a page-level override by rendering
          a floating badge near the page heading instead. */}
      <div className="space-y-6 pb-16">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Search by user email..."
            className="w-64"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateTo ? format(dateTo, 'MMM d, yyyy') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
            </PopoverContent>
          </Popover>

          {/* Pending count badge — inline in filter bar since AppShell title is static */}
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-auto font-mono">
              {pendingCount} pending
            </Badge>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <>
            <AppealCardSkeleton />
            <AppealCardSkeleton />
            <AppealCardSkeleton />
          </>
        ) : visibleAppeals.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-lg">Queue is empty</p>
            <p className="text-sm text-muted-foreground">All appeals have been reviewed</p>
          </div>
        ) : (
          visibleAppeals.map((appeal, idx) => (
            <div
              key={appeal.id}
              className={cn(
                'transition-opacity duration-300',
                dismissedIds.has(appeal.id) ? 'opacity-0' : 'opacity-100'
              )}
            >
              <AppealCard
                appeal={appeal}
                onResolve={(id, decision, response) =>
                  resolveMutation.mutate({ appealId: id, decision, adminResponse: response })
                }
                isPending={resolveMutation.isPending && resolveMutation.variables?.appealId === appeal.id}
                focused={focusedIndex === idx}
                onFocus={() => setFocusedIndex(idx)}
                acceptDialogOpen={acceptDialogIndex === idx}
                onAcceptDialogChange={(open) => setAcceptDialogIndex(open ? idx : -1)}
              />
            </div>
          ))
        )}
      </div>

      {/* Fixed keyboard shortcut footer — accounts for 240px sidebar */}
      <div className="fixed bottom-0 right-0 left-60 bg-card/80 backdrop-blur-sm border-t border-border px-8 py-2 z-20">
        <p className="text-xs text-muted-foreground font-mono">
          J next · K prev · A accept · R reject — keyboard shortcuts active when not in a text field
        </p>
      </div>
    </>
  );
}
