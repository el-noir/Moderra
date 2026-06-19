'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';
import { ImageVerdict } from '@/lib/types';
import { outcomeLabel } from '@/lib/labels';
import { VerdictOverrideModal } from '@/components/VerdictOverrideModal';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function AdminVerdictsPage() {
  const token = getAccessToken();
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState<string>('all');
  const [category, setCategory] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verdicts', page, outcome, category],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (outcome !== 'all') params.append('outcome', outcome);
      if (category) params.append('category', category);
      
      return apiRequest<{ items: ImageVerdict[]; total: number; totalPages: number }>(
        `/api/admin/verdicts?${params.toString()}`,
        {},
        token
      );
    },
    enabled: Boolean(token),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Verdicts</h1>

      <div className="flex gap-4">
        <div className="w-48">
          <Select value={outcome} onValueChange={setOutcome}>
            <SelectTrigger><SelectValue placeholder="Outcome" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-64">
          <Input 
            placeholder="Filter by category..." 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <p>Loading verdicts...</p>
      ) : (
        <>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Categories Triggered</TableHead>
                  <TableHead>Overridden</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((v) => {
                  const detected = v.categoryResults.filter(c => c.classification === 'detected');
                  return (
                    <TableRow key={v.id}>
                      <TableCell>{new Date(v.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <a href={`http://localhost:3000${v.imagePath}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                          {v.originalFilename}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.outcome === 'approved' ? 'default' : v.outcome === 'flagged' ? 'secondary' : 'destructive'}>
                          {outcomeLabel(v.outcome)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {detected.length > 0 
                          ? detected.map(c => c.category).join(', ') 
                          : 'None'}
                      </TableCell>
                      <TableCell>
                        {v.override?.isOverridden ? (
                          <Badge variant="outline">Yes by Admin</Badge>
                        ) : 'No'}
                      </TableCell>
                      <TableCell>
                        <VerdictOverrideModal verdict={v} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No verdicts found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-4 items-center">
              <Button disabled={page === 1} onClick={() => setPage(p => p - 1)} variant="outline">Previous</Button>
              <span>Page {page} of {data.totalPages}</span>
              <Button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} variant="outline">Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
