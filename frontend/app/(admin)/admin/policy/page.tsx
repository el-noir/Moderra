'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronDown, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { apiRequest } from '@/lib/api';
import { getAccessToken, getStoredUser } from '@/lib/auth-token';
import { PolicyCategoryRow, type PolicyCategory } from '@/components/moderation';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type PolicyVersion = {
  id: string;
  version: number;
  isActive: boolean;
  createdBy: string;
  categories: PolicyCategory[];
  createdAt: string;
};

type AdminPolicyResponse = {
  active: PolicyVersion;
  history: PolicyVersion[];
};

export default function AdminPolicyPage() {
  const token = getAccessToken();
  const user = getStoredUser();
  const queryClient = useQueryClient();

  const [localCategories, setLocalCategories] = useState<PolicyCategory[]>([]);
  const [pulseVersion, setPulseVersion] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'policy'],
    queryFn: () =>
      apiRequest<AdminPolicyResponse>('/api/admin/policy', {}, token),
    enabled: Boolean(token) && user?.role === 'admin',
  });

  // Sync loaded active policy to local editable state
  useEffect(() => {
    if (data?.active?.categories) {
      setLocalCategories(JSON.parse(JSON.stringify(data.active.categories)));
    }
  }, [data?.active]);

  const saveMutation = useMutation({
    mutationFn: (newCategories: PolicyCategory[]) =>
      apiRequest<PolicyVersion>(
        '/api/admin/policy',
        {
          method: 'PUT',
          body: JSON.stringify({ categories: newCategories }),
        },
        token
      ),
    onSuccess: (newVersion) => {
      toast.info(`Policy saved — now version ${newVersion.version}`);
      
      // Animate badge
      setPulseVersion(true);
      setTimeout(() => setPulseVersion(false), 400);

      // Invalidate to reload history
      void queryClient.invalidateQueries({ queryKey: ['admin', 'policy'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save policy');
    },
  });

  // Compare local state to original to track unsaved changes
  const modifiedCategories = useMemo(() => {
    if (!data?.active?.categories) return [];
    
    return localCategories.filter((localCat) => {
      const originalCat = data.active.categories.find((c) => c.name === localCat.name);
      if (!originalCat) return true;
      return (
        localCat.enabled !== originalCat.enabled ||
        localCat.confidenceThreshold !== originalCat.confidenceThreshold ||
        localCat.enforcement !== originalCat.enforcement
      );
    });
  }, [localCategories, data?.active?.categories]);

  const modifiedCount = modifiedCategories.length;

  const handleCategoryChange = (updated: PolicyCategory) => {
    setLocalCategories((prev) =>
      prev.map((c) => (c.name === updated.name ? updated : c))
    );
  };

  const handleDiscard = () => {
    if (data?.active?.categories) {
      setLocalCategories(JSON.parse(JSON.stringify(data.active.categories)));
    }
  };

  const handleSave = () => {
    saveMutation.mutate(localCategories);
  };

  if (!token || user?.role !== 'admin') return null;

  if (isError) {
    return (
      <div className="p-12 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load policy. Please try again.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const activePolicy = data.active;
  const history = data.history;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Left column — Policy editor */}
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center">
              <h2 className="text-xl font-semibold">Active Policy</h2>
              <Badge
                variant="secondary"
                className={cn(
                  'ml-3 font-mono motion-safe:transition-transform duration-300',
                  pulseVersion && 'scale-125 bg-primary text-primary-foreground'
                )}
              >
                v{activePolicy.version}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground font-mono block mt-0.5">
              Updated {format(new Date(activePolicy.createdAt), 'MMM d, yyyy HH:mm')} by {activePolicy.createdBy}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {localCategories.map((category) => {
            const isModified = modifiedCategories.some((c) => c.name === category.name);
            return (
              <PolicyCategoryRow
                key={category.name}
                category={category}
                modified={isModified}
                onChange={handleCategoryChange}
                disabled={saveMutation.isPending}
              />
            );
          })}
        </div>

        {/* Sticky unsaved changes bar */}
        {modifiedCount > 0 && (
          <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 -mx-8 mt-6 flex items-center justify-between z-10 animate-in slide-in-from-bottom-2">
            <span className="text-sm text-muted-foreground">
              {modifiedCount} unsaved change{modifiedCount !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                disabled={saveMutation.isPending}
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save as New Version
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right column — Version history */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Version History
        </h3>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-1">
            {history.map((version) => (
              <Collapsible key={version.id} className="group">
                <CollapsibleTrigger asChild>
                  <div tabIndex={0} className="flex items-center gap-3 py-3 px-3 rounded-md hover:bg-muted cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {/* Left dot */}
                    <div className="flex shrink-0 items-center">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          version.isActive ? 'bg-primary' : 'bg-muted-foreground/40'
                        )}
                      />
                      {version.isActive && (
                        <Badge variant="default" className="ml-2 text-[10px] px-1.5 py-0 h-4 font-mono leading-none">
                          ACTIVE
                        </Badge>
                      )}
                    </div>

                    {/* Center text */}
                    <div className="flex-1 flex flex-col items-start overflow-hidden">
                      <span className="font-mono font-medium text-sm">v{version.version}</span>
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {format(new Date(version.createdAt), 'MMM d, yyyy')} · by {version.createdBy}
                      </span>
                    </div>

                    {/* Right chevron */}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="bg-muted/50 rounded-md mx-3 mb-2 p-3 space-y-2 border border-border">
                    {version.categories.map((cat) => (
                      <div key={cat.name} className="flex items-center text-xs leading-none">
                        <span className="w-36 shrink-0 truncate font-medium text-muted-foreground">
                          {cat.name}
                        </span>
                        {cat.enabled ? (
                          <>
                            <span className="font-mono text-muted-foreground w-12">{cat.confidenceThreshold}%</span>
                            <span className={cn('font-mono text-[10px] uppercase', cat.enforcement === 'auto_block' ? 'text-verdict-blocked' : 'text-verdict-flagged')}>
                              {cat.enforcement === 'auto_block' ? 'BLOCK' : 'REVIEW'}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/50 italic">Disabled</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
