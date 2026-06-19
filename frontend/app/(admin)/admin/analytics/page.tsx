'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';
import type {
  AnalyticsResponse,
  SubmissionOverTime,
  VerdictByCategory,
  UserRankRow,
} from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// ── Inline bar chart (no extra dependency) ────────────────────────────────────

function BarChart({ data }: { data: SubmissionOverTime[] }) {
  if (!data.length) return <p className="text-muted-foreground text-sm">No data in range.</p>;

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-1">
      {data.map((d) => (
        <div key={d.date} className="flex items-center gap-2 text-sm">
          <span className="w-24 shrink-0 text-muted-foreground tabular-nums">{d.date}</span>
          <div className="flex-1 bg-muted rounded overflow-hidden h-5">
            <div
              className="h-full bg-primary rounded transition-all"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right tabular-nums font-medium">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Outcome badge colours ─────────────────────────────────────────────────────

function outcomeBadge(outcome: 'approved' | 'flagged' | 'blocked') {
  const map = {
    approved: 'default',
    flagged: 'secondary',
    blocked: 'destructive',
  } as const;
  return <Badge variant={map[outcome]}>{outcome}</Badge>;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const token = getAccessToken();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-analytics', appliedFrom, appliedTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (appliedFrom) params.set('dateFrom', appliedFrom);
      if (appliedTo) params.set('dateTo', appliedTo);
      const qs = params.toString();
      return apiRequest<AnalyticsResponse>(
        `/api/admin/analytics${qs ? `?${qs}` : ''}`,
        {},
        token,
      );
    },
    enabled: Boolean(token),
  });

  function applyFilter() {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  }

  function clearFilter() {
    setDateFrom('');
    setDateTo('');
    setAppliedFrom('');
    setAppliedTo('');
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Loading analytics…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-destructive">
          {error instanceof Error ? error.message : 'Failed to load analytics.'}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">No data available.</p>
      </div>
    );
  }

  const analytics = data;
  const { byOutcome } = analytics.verdictDistribution;
  const totalVerdicts = byOutcome.approved + byOutcome.flagged + byOutcome.blocked;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>

      {/* ── Date filter ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Date Range Filter (Submissions Over Time)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="dateFrom">From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateTo">To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={applyFilter} size="sm">Apply</Button>
            <Button onClick={clearFilter} size="sm" variant="outline">Clear</Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 1: Submissions over time ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={analytics.submissionsOverTime} />
          {analytics.submissionsOverTime.length > 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              Total in range:{' '}
              <strong>
                {analytics.submissionsOverTime.reduce((s, d) => s + d.count, 0)}
              </strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Verdict distribution ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By outcome */}
        <Card>
          <CardHeader>
            <CardTitle>Verdict Distribution — by Outcome</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Outcome</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(['approved', 'flagged', 'blocked'] as const).map((o) => (
                  <TableRow key={o}>
                    <TableCell>{outcomeBadge(o)}</TableCell>
                    <TableCell className="text-right tabular-nums">{byOutcome[o]}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {totalVerdicts === 0
                        ? '—'
                        : `${((byOutcome[o] / totalVerdicts) * 100).toFixed(1)}%`}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right tabular-nums">{totalVerdicts}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* By category */}
        <Card>
          <CardHeader>
            <CardTitle>Verdict Distribution — by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.verdictDistribution.byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No category results yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Detected</TableHead>
                    <TableHead className="text-right">Not detected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.verdictDistribution.byCategory.map((c: VerdictByCategory) => (
                    <TableRow key={c.category}>
                      <TableCell className="text-sm">{c.category}</TableCell>
                      <TableCell className="text-right tabular-nums text-destructive">
                        {c.detected}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {c.notDetected}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Section 3: Appeal stats ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Appeal Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: analytics.appealStats.total },
              { label: 'Pending', value: analytics.appealStats.pending },
              { label: 'Accepted', value: analytics.appealStats.accepted },
              { label: 'Rejected', value: analytics.appealStats.rejected },
              {
                label: 'Resolution Rate',
                value: `${(analytics.appealStats.resolutionRate * 100).toFixed(1)}%`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 4: User rankings ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserRankTable
          title="Top 10 — by Submission Count"
          rows={analytics.userRankings.bySubmissionCount}
          countLabel="Submissions"
        />
        <UserRankTable
          title="Top 10 — by Violation Count"
          rows={analytics.userRankings.byViolationCount}
          countLabel="Violations (flagged + blocked)"
        />
      </div>
    </div>
  );
}

function UserRankTable({
  title,
  rows,
  countLabel,
}: {
  title: string;
  rows: UserRankRow[];
  countLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">{countLabel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={r.userId}>
                  <TableCell className="text-muted-foreground tabular-nums w-8">{i + 1}</TableCell>
                  <TableCell className="text-sm truncate max-w-[140px]">{r.email}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{r.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
