'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { CalendarIcon, TrendingUp, TrendingDown, Loader2, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { apiRequest } from '@/lib/api';
import { getAccessToken, getStoredUser } from '@/lib/auth-token';
import type { AnalyticsResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const COLORS = {
  approved: '#10b981', // emerald-500
  flagged: '#f59e0b', // amber-500
  blocked: '#ef4444', // red-500
};

export default function AnalyticsPage() {
  const token = getAccessToken();
  const user = getStoredUser();

  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Category sort state
  const [catSortAsc, setCatSortAsc] = useState(false);

  useEffect(() => {
    setPortalTarget(document.getElementById('top-bar-action-slot'));
  }, []);

  const queryParams = new URLSearchParams();
  queryParams.set('dateFrom', dateFrom.toISOString());
  queryParams.set('dateTo', dateTo.toISOString());

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'analytics', dateFrom.toISOString(), dateTo.toISOString()],
    queryFn: () =>
      apiRequest<AnalyticsResponse>(
        `/api/admin/analytics?${queryParams.toString()}`,
        {},
        token
      ),
    enabled: Boolean(token) && user?.role === 'admin',
  });

  const sortedCategories = useMemo(() => {
    if (!data?.verdictDistribution?.byCategory) return [];
    return [...data.verdictDistribution.byCategory].sort((a, b) => {
      const rateA = a.detected / Math.max(1, a.detected + a.notDetected);
      const rateB = b.detected / Math.max(1, b.detected + b.notDetected);
      return catSortAsc ? rateA - rateB : rateB - rateA;
    });
  }, [data?.verdictDistribution?.byCategory, catSortAsc]);

  if (!token || user?.role !== 'admin') return null;

  if (isError) {
    return (
      <div className="p-12 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load analytics. Please try again.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderTopBarAction = () => {
    return (
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="font-normal text-sm w-36 justify-start">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'From'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground">—</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="font-normal text-sm w-36 justify-start">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dateTo ? format(dateTo, 'MMM d, yyyy') : 'To'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const getRankBadgeProps = (rank: number) => {
    if (rank === 0) return { className: 'bg-[#fbbf24] text-[#78350f]', label: '1st' };
    if (rank === 1) return { className: 'bg-[#94a3b8] text-[#0f172a]', label: '2nd' };
    if (rank === 2) return { className: 'bg-[#b45309] text-[#fffbeb]', label: '3rd' };
    return null;
  };

  // Safe formatting helpers
  const formatNum = (num?: number) => (num || 0).toLocaleString();
  const getApprovalRate = () => {
    if (!data) return 0;
    const { approved, flagged, blocked } = data.verdictDistribution.byOutcome;
    const total = approved + flagged + blocked;
    if (total === 0) return 0;
    return ((approved / total) * 100).toFixed(1);
  };

  const pieData = data ? [
    { name: 'Approved', value: data.verdictDistribution.byOutcome.approved, color: COLORS.approved },
    { name: 'Flagged', value: data.verdictDistribution.byOutcome.flagged, color: COLORS.flagged },
    { name: 'Blocked', value: data.verdictDistribution.byOutcome.blocked, color: COLORS.blocked },
  ].filter(d => d.value > 0) : [];

  const totalVerdicts = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Inject Date Picker into Top Bar */}
      {portalTarget && createPortal(renderTopBarAction(), portalTarget)}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Submissions', value: formatNum(data?.submissionsOverTime?.reduce((acc, curr) => acc + curr.count, 0)) },
          { label: 'Approval Rate (%)', value: getApprovalRate() },
          { label: 'Pending Appeals', value: formatNum(data?.appealStats?.pending) },
          { label: 'Resolution Rate (%)', value: data?.appealStats?.resolutionRate != null ? (data.appealStats.resolutionRate * 100).toFixed(1) : '0.0' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold font-mono text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Bar Chart */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-6">Submissions over time</h3>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.submissionsOverTime || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => format(new Date(val), 'MMM d')}
                      stroke="#888"
                      fontSize={12}
                    />
                    <YAxis stroke="#888" fontSize={12} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                      labelFormatter={(label) => format(new Date(label as string), 'MMM d, yyyy')}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="approved" name="Approved" stackId="a" fill={COLORS.approved} />
                    <Bar dataKey="flagged" name="Flagged" stackId="a" fill={COLORS.flagged} />
                    <Bar dataKey="blocked" name="Blocked" stackId="a" fill={COLORS.blocked} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 w-full text-left">Verdict Distribution</h3>
            {isLoading ? (
              <Skeleton className="h-64 w-64 rounded-full" />
            ) : (
              <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                      formatter={(value: number) => [formatNum(value), 'Verdicts']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold font-mono">{formatNum(totalVerdicts)}</span>
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Category Breakdown</h3>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Detected</TableHead>
                  <TableHead className="text-right">Not Detected</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    onClick={() => setCatSortAsc(!catSortAsc)}
                  >
                    Detection Rate {catSortAsc ? '↑' : '↓'}
                  </TableHead>
                  <TableHead className="text-right">Avg Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No category data available for this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedCategories.map((cat) => {
                    const total = cat.detected + cat.notDetected;
                    const rate = total > 0 ? (cat.detected / total) * 100 : 0;
                    return (
                      <TableRow key={cat.category}>
                        <TableCell className="font-medium text-sm">{cat.category}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatNum(cat.detected)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatNum(cat.notDetected)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {rate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {/* We don't have avg confidence in the backend schema currently, placeholder it */}
                          —
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top Users Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Submitters */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Top Submitters</h3>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">Rank</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Submissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={3}><Skeleton className="h-6 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : !data?.userRankings?.bySubmissionCount?.length ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No data</TableCell>
                    </TableRow>
                  ) : (
                    data.userRankings.bySubmissionCount.map((user, i) => {
                      const badge = getRankBadgeProps(i);
                      return (
                        <TableRow key={user.userId}>
                          <TableCell className="text-center">
                            {badge ? (
                              <Badge variant="outline" className={cn('px-1.5 py-0 text-[10px]', badge.className)}>
                                {badge.label}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">{i + 1}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatNum(user.count)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Top Violations */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Top Violations</h3>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">Rank</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Violations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={3}><Skeleton className="h-6 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : !data?.userRankings?.byViolationCount?.length ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No data</TableCell>
                    </TableRow>
                  ) : (
                    data.userRankings.byViolationCount.map((user, i) => {
                      const badge = getRankBadgeProps(i);
                      return (
                        <TableRow key={user.userId}>
                          <TableCell className="text-center">
                            {badge ? (
                              <Badge variant="outline" className={cn('px-1.5 py-0 text-[10px]', badge.className)}>
                                {badge.label}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">{i + 1}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatNum(user.count)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
