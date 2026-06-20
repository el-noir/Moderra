'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import {
  CalendarIcon,
  ChevronDown,
  Filter,
  Inbox,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';
import type { Submission } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VerdictBadge } from '@/components/moderation';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

export default function HistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = getAccessToken();

  // URL state
  const outcomeParam = searchParams.get('outcome') || 'All';
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Local state mirrored from URL to avoid hydration mismatch and manage calendar inputs
  const [outcome, setOutcome] = useState(outcomeParam);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    fromParam ? new Date(fromParam) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    toParam ? new Date(toParam) : undefined
  );
  const [page, setPage] = useState(pageParam);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (outcome !== 'All') params.set('outcome', outcome);
    if (dateFrom) params.set('from', dateFrom.toISOString());
    if (dateTo) params.set('to', dateTo.toISOString());
    if (page > 1) params.set('page', page.toString());
    
    router.replace(`/history?${params.toString()}`, { scroll: false });
  }, [outcome, dateFrom, dateTo, page, router]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (outcome !== 'All') params.set('outcome', outcome);
    if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
    if (dateTo) params.set('dateTo', dateTo.toISOString());
    return params.toString();
  }, [outcome, dateFrom, dateTo]);

  const { data: submissions, isLoading, isError, refetch } = useQuery({
    queryKey: ['submissions', queryParams],
    queryFn: () => apiRequest<Submission[]>(`/api/submissions?${queryParams}`, {}, token),
    enabled: Boolean(token),
  });

  const clearFilters = () => {
    setOutcome('All');
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  const hasActiveFilters = outcome !== 'All' || dateFrom || dateTo;

  // Manual client-side pagination since backend doesn't support it
  const itemsPerPage = 10;
  const paginatedSubmissions = useMemo(() => {
    if (!submissions) return [];
    const startIndex = (page - 1) * itemsPerPage;
    return submissions.slice(startIndex, startIndex + itemsPerPage);
  }, [submissions, page]);

  const totalPages = submissions ? Math.max(1, Math.ceil(submissions.length / itemsPerPage)) : 1;

  if (!token) {
    return (
      <div className="text-center mt-20 space-y-4">
        <h1 className="text-2xl font-bold">Submission History</h1>
        <p className="text-muted-foreground">You need to log in to view your history.</p>
        <Button asChild>
          <Link href="/login">Go to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex gap-3 flex-wrap items-center mb-6">
        <div className="flex bg-muted/50 p-1 rounded-md border border-border">
          {['All', 'approved', 'flagged', 'blocked'].map((opt) => (
            <Button
              key={opt}
              variant="outline"
              size="sm"
              onClick={() => {
                setOutcome(opt === outcome ? 'All' : opt);
                setPage(1);
              }}
              className={cn(
                'border-transparent shadow-none',
                outcome === opt
                  ? 'bg-primary/10 border-primary text-primary font-medium hover:bg-primary/20 hover:text-primary'
                  : 'bg-transparent text-muted-foreground'
              )}
            >
              {opt === 'All' ? 'All' : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Button>
          ))}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'From'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={(d) => { setDateFrom(d); setPage(1); }}
            />
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
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={(d) => { setDateTo(d); setPage(1); }}
            />
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center p-4 border border-border rounded-md">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-8 w-8 ml-auto" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive" className="my-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load history. Please try again.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : submissions?.length === 0 && !hasActiveFilters ? (
        <div className="text-center py-20 flex flex-col items-center">
          <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium">No submissions yet</h2>
          <p className="text-sm text-muted-foreground mt-1">Submit images to start screening them</p>
          <Button asChild className="mt-4">
            <Link href="/submit">Submit Images</Link>
          </Button>
        </div>
      ) : paginatedSubmissions.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center">
          <Filter className="h-8 w-8 text-muted-foreground mb-3" />
          <h2 className="text-base font-medium">No submissions match these filters</h2>
          <Button variant="outline" className="mt-3" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="border border-transparent md:border-border rounded-md overflow-hidden bg-transparent md:bg-card overflow-x-auto">
            <Table className="block md:table w-full">
              <TableHeader className="hidden md:table-header-group bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Submitted</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Images</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Outcomes</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Policy</TableHead>
                  <TableHead className="text-xs text-muted-foreground uppercase tracking-wider font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              {paginatedSubmissions.map((submission) => {
                  const uniqueOutcomes = Array.from(
                    new Set(submission.imageVerdicts.map((v) => v.outcome))
                  );
                  
                  return (
                    <Collapsible key={submission.id} asChild>
                      <TableBody className="block md:table-row-group space-y-4 md:space-y-0">
                        <TableRow className="block md:table-row bg-card md:bg-transparent border md:border-b border-border rounded-lg md:rounded-none p-4 md:p-0 shadow-sm md:shadow-none cursor-pointer hover:bg-muted/50 transition-colors group">
                            <TableCell className="block md:table-cell w-full md:w-auto flex justify-between items-center border-b md:border-none pb-2 mb-2 md:pb-4 md:mb-0">
                              <span className="md:hidden text-xs text-muted-foreground font-medium uppercase tracking-wider">Submitted</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-mono text-sm">
                                      {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {new Date(submission.createdAt).toLocaleString()}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="block md:table-cell w-full md:w-auto flex justify-between items-center border-b md:border-none pb-2 mb-2 md:pb-4 md:mb-0">
                              <span className="md:hidden text-xs text-muted-foreground font-medium uppercase tracking-wider">Images</span>
                              <span className="font-mono text-sm text-muted-foreground">
                                {submission.imageVerdicts.length}
                              </span>
                            </TableCell>
                            <TableCell className="block md:table-cell w-full md:w-auto flex justify-between items-center border-b md:border-none pb-2 mb-2 md:pb-4 md:mb-0">
                              <span className="md:hidden text-xs text-muted-foreground font-medium uppercase tracking-wider">Outcomes</span>
                              <div className="flex gap-1 flex-wrap">
                                {uniqueOutcomes.map((outcome) => (
                                  <VerdictBadge key={outcome} outcome={outcome} size="sm" />
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="block md:table-cell w-full md:w-auto flex justify-between items-center border-b md:border-none pb-2 mb-2 md:pb-4 md:mb-0">
                              <span className="md:hidden text-xs text-muted-foreground font-medium uppercase tracking-wider">Policy</span>
                              <span className="font-mono text-xs text-muted-foreground">
                                v? {/* The exact version depends on policy Snapshot, placeholder for now */}
                              </span>
                            </TableCell>
                            <TableCell className="block md:table-cell w-full md:w-auto text-right md:text-right flex justify-center md:justify-end pt-2 md:pt-4">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <div>
                                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                                  </div>
                                </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                          </TableRow>
                        <CollapsibleContent asChild>
                          <TableRow className="block md:table-row bg-muted/10 border-b border-border">
                            <TableCell colSpan={5} className="block md:table-cell p-0">
                              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {submission.imageVerdicts.map((verdict) => {
                                  const topCategory = verdict.categoryResults?.find(c => c.classification === 'detected');
                                  return (
                                    <div key={verdict.id} className="flex flex-col gap-2 p-2 rounded-md bg-card border border-border shadow-sm">
                                      {verdict.imagePath ? (
                                        <div className="h-20 w-full relative bg-muted rounded-md overflow-hidden">
                                          {/* In actual app, imagePath from backend must be a reachable URL or proxied. For now using img tag or placeholder */}
                                          <Image src={`/api/uploads/${verdict.imagePath.split('/').pop()}`} alt={verdict.originalFilename} fill className="object-cover" />
                                        </div>
                                      ) : (
                                        <div className="h-20 w-full bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                                          No Image
                                        </div>
                                      )}
                                      <div className="flex flex-col items-start gap-1">
                                        <VerdictBadge outcome={verdict.outcome} size="sm" />
                                        <span className="text-xs text-muted-foreground truncate w-full" title={topCategory?.category ?? 'No flags'}>
                                          {topCategory ? topCategory.category : 'No flags'}
                                        </span>
                                      </div>
                                      <Button variant="link" size="sm" asChild className="text-primary mt-2 px-0 h-auto self-start">
                                        <Link href={`/history/${submission.id}?v=${verdict.id}`}>View full detail &rarr;</Link>
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </TableBody>
                    </Collapsible>
                  );
                })}
            </Table>
          </div>
          
          <div className="flex items-center justify-between py-4">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
