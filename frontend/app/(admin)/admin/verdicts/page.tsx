'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon, Loader2, X } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getAccessToken, getStoredUser } from '@/lib/auth-token';
import type { AdminVerdictResponse } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { OverrideDialog, VerdictBadge } from '@/components/moderation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function AdminVerdictsPage() {
  const token = getAccessToken();
  const user = getStoredUser();

  const [page, setPage] = useState(1);
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'approved' | 'flagged' | 'blocked'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [emailInput, setEmailInput] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [hasOverride, setHasOverride] = useState(false);

  const debouncedEmail = useDebounce(emailInput, 300);

  // Calculate active filter count
  const activeFilterCount =
    (outcomeFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (debouncedEmail ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0) +
    (hasOverride ? 1 : 0);

  const handleClearFilters = () => {
    setOutcomeFilter('all');
    setCategoryFilter('all');
    setEmailInput('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setHasOverride(false);
    setPage(1);
  };

  const queryParams = new URLSearchParams({ page: String(page) });
  if (outcomeFilter !== 'all') queryParams.set('outcome', outcomeFilter);
  if (categoryFilter !== 'all') queryParams.set('category', categoryFilter);
  if (debouncedEmail) queryParams.set('email', debouncedEmail);
  if (dateFrom) queryParams.set('dateFrom', dateFrom.toISOString());
  if (dateTo) queryParams.set('dateTo', dateTo.toISOString());
  if (hasOverride) queryParams.set('hasOverride', 'true');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'verdicts', queryParams.toString()],
    queryFn: () =>
      apiRequest<{ items: AdminVerdictResponse[]; totalPages: number }>(
        `/api/admin/verdicts?${queryParams.toString()}`,
        {},
        token
      ),
    enabled: Boolean(token) && user?.role === 'admin',
  });

  if (!token || user?.role !== 'admin') return null;

  return (
    <div className="space-y-6 pb-16">
      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap items-center mb-6">
        {/* Outcome toggles */}
        <div className="flex rounded-md border border-border overflow-hidden">
          {(['all', 'approved', 'flagged', 'blocked'] as const).map((o) => (
            <Button
              key={o}
              variant="outline"
              size="sm"
              onClick={() => { setOutcomeFilter(o); setPage(1); }}
              className={cn(
                'rounded-none border-none border-r border-border last:border-r-0',
                outcomeFilter === o && 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
              )}
            >
              {o.charAt(0).toUpperCase() + o.slice(1)}
            </Button>
          ))}
        </div>

        {/* Category Select */}
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48 h-9 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* User email */}
        <Input
          placeholder="Filter by email..."
          className="w-48 h-9 text-sm"
          value={emailInput}
          onChange={(e) => { setEmailInput(e.target.value); setPage(1); }}
        />

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="font-normal text-sm w-32 justify-start">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dateFrom ? (
                <span className="font-mono text-xs">{format(dateFrom, 'MM/dd/yy')}</span>
              ) : (
                'From'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={dateFrom} onSelect={(d) => { setDateFrom(d); setPage(1); }} />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="font-normal text-sm w-32 justify-start">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dateTo ? (
                <span className="font-mono text-xs">{format(dateTo, 'MM/dd/yy')}</span>
              ) : (
                'To'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={dateTo} onSelect={(d) => { setDateTo(d); setPage(1); }} />
          </PopoverContent>
        </Popover>

        {/* Has override toggle */}
        <div className="flex items-center gap-2 px-2 border rounded-md h-9 bg-card">
          <Switch
            id="override-switch"
            checked={hasOverride}
            onCheckedChange={(c) => { setHasOverride(c); setPage(1); }}
          />
          <Label htmlFor="override-switch" className="text-sm cursor-pointer whitespace-nowrap">
            Has override
          </Label>
        </div>

        {/* Active filter count + Clear */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <Badge variant="secondary" className="font-mono">{activeFilterCount}</Badge>
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground px-2 h-9">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Top Category</TableHead>
              <TableHead>Policy</TableHead>
              <TableHead>Override</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : !data?.items.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No verdicts found.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((verdict) => {
                const topCategory = verdict.categoryResults?.find((c) => c.classification === 'detected');
                
                return (
                  <TableRow key={verdict.id}>
                    <TableCell className="text-sm font-medium">
                      {(verdict as any).user?.email ?? verdict.userId}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {format(new Date(verdict.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <VerdictBadge outcome={verdict.outcome} size="sm" />
                        {verdict.override?.isOverridden && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div tabIndex={0} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm cursor-help">
                                  <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground px-1 py-0 cursor-inherit">
                                    OVERRIDDEN
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="font-mono text-xs space-y-1">
                                  <p>By: {verdict.override.by}</p>
                                  <p>On: {format(new Date(verdict.override.at), 'MMM d, yyyy HH:mm')}</p>
                                  <p className="max-w-[200px] break-words">Reason: {verdict.override.reason}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {topCategory ? (
                        <span className="text-sm text-muted-foreground">{topCategory.category}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Fake policy version as it is not stored currently, backend returns snapshot not version */}
                      <span className="font-mono text-xs text-muted-foreground">v?</span>
                    </TableCell>
                    <TableCell>
                      {verdict.override?.isOverridden ? 'Yes' : 'No'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/history/${verdict.submissionId}`}>View</Link>
                        </Button>
                        <OverrideDialog verdict={verdict}>
                          <Button variant="outline" size="sm">Override</Button>
                        </OverrideDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-end gap-4 items-center">
          <Button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} variant="outline" size="sm">
            Previous
          </Button>
          <span className="text-sm font-mono">
            Page {page} of {data.totalPages}
          </span>
          <Button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} variant="outline" size="sm">
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
