'use client';

import React, { FormEvent, useMemo, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-token';
import type { Submission } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  UploadCloud,
  X,
  Loader2,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { VerdictBadge, CategoryRow } from '@/components/moderation';

type FilePreview = {
  file: File;
  previewUrl: string;
};

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function SubmitPage() {
  const token = getAccessToken();
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [result, setResult] = useState<Submission | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitMutation = useMutation({
    mutationFn: async (selectedFiles: File[]) => {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('images', file));

      return apiRequest<Submission>(
        '/api/submissions',
        {
          method: 'POST',
          body: formData,
        },
        token
      );
    },
    onSuccess: (submission) => {
      setResult(submission);
      toast.success('Screening complete');
    },
    onError: () => {
      toast.error('Submission failed — please try again');
    },
  });

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((f) => f.type.startsWith('image/'));
    const previews = validFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setFiles((prev) => [...prev, ...previews]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].previewUrl);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) return;
    setResult(null);
    submitMutation.mutate(files.map((f) => f.file));
  };

  const totalSize = useMemo(() => {
    return files.reduce((acc, curr) => acc + curr.file.size, 0);
  }, [files]);

  if (!token) {
    return (
      <div className="text-center mt-20 space-y-4">
        <h1 className="text-2xl font-bold">Submit images</h1>
        <p className="text-muted-foreground">
          You need to log in before submitting images.
        </p>
        <Button asChild>
          <Link href="/login">Go to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Submit images</h1>
        <p className="text-muted-foreground">
          Upload one or more images for moderation. Each image receives its own
          verdict.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card
          tabIndex={0}
          role="button"
          aria-label="File upload dropzone"
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
            isDragOver ? 'border-primary bg-primary/5' : 'border-border bg-card',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-base text-muted-foreground">
              Drop images here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WEBP up to 10MB each
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </Card>

        {files.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-3">
              {files.map((f, i) => (
                <div key={`${f.file.name}-${i}`} className="relative group">
                  <Image
                    src={f.previewUrl}
                    alt={f.file.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 object-cover rounded-md border border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-3">
              {files.length} image{files.length === 1 ? '' : 's'} selected ·{' '}
              {formatBytes(totalSize)} total
            </p>
          </div>
        )}

        <div className="mt-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block">
                  <Button
                    type="submit"
                    disabled={!files.length || submitMutation.isPending}
                    className="w-full"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Screening images...
                      </>
                    ) : (
                      'Screen Images'
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {!files.length && (
                <TooltipContent>
                  <p>Add at least one image to continue</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {files.length >= 3 && submitMutation.isPending && (
            <p className="text-sm text-muted-foreground font-mono mt-3 text-center">
              Screening {files.length} images...
            </p>
          )}
        </div>
      </form>

      {submitMutation.isError && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Submission Failed</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span>Failed to process your submission. Please try again.</span>
            <Button variant="outline" size="sm" onClick={() => submitMutation.mutate(files.map(f => f.file))}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Results Panel */}
      <div
        className={cn(
          'transition-opacity duration-300',
          result ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {result && (
          <Tabs
            defaultValue={result.imageVerdicts[0]?.id}
            className="w-full space-y-6"
          >
            {result.imageVerdicts.length > 1 && (
              <TabsList className="w-full justify-start overflow-x-auto p-1 h-auto bg-muted/50 rounded-lg">
                {result.imageVerdicts.map((verdict, idx) => {
                  const previewUrl = files.find(
                    (f) => f.file.name === verdict.originalFilename
                  )?.previewUrl;

                  return (
                    <TabsTrigger
                      key={verdict.id}
                      value={verdict.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                    >
                      {previewUrl && (
                        <Image
                          src={previewUrl}
                          alt="thumbnail"
                          width={24}
                          height={24}
                          className="h-6 w-6 rounded-sm object-cover"
                        />
                      )}
                      <span className="max-w-[120px] truncate text-xs font-medium">
                        {verdict.originalFilename}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            )}

            {result.imageVerdicts.map((verdict) => {
              const previewUrl = files.find(
                (f) => f.file.name === verdict.originalFilename
              )?.previewUrl;

              return (
                <TabsContent key={verdict.id} value={verdict.id}>
                  <Card className="p-6 space-y-6">
                    {/* Main image preview */}
                    {previewUrl && (
                      <div className="w-full flex justify-center bg-muted/30 rounded-lg p-4 border border-border">
                        <Image
                          src={previewUrl}
                          alt="preview"
                          width={600}
                          height={400}
                          className="max-h-64 w-auto object-contain rounded-md shadow-sm"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between py-2">
                      <VerdictBadge outcome={verdict.outcome} size="lg" />
                      <span className="text-xs text-muted-foreground font-mono">
                        Policy v? · {verdict.categoryResults?.length ?? 0}{' '}
                        categories
                      </span>
                    </div>

                    <Separator />

                    {verdict.processingError ? (
                      <Alert className="border-verdict-flagged-border bg-verdict-flagged-bg/20 text-verdict-flagged">
                        <AlertTriangle className="h-4 w-4 !text-verdict-flagged" />
                        <AlertTitle className="font-semibold tracking-wide">
                          This image was flagged for manual review
                        </AlertTitle>
                        <AlertDescription className="text-verdict-flagged/80 mt-2">
                          Our automated screening encountered an issue. A human
                          reviewer will assess this image.
                          <br />
                          <span className="font-mono text-xs opacity-70 mt-2 block">
                            Error: {verdict.processingError}
                          </span>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-3">
                        <h3 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                          AI Analysis
                        </h3>
                        <div className="space-y-2">
                          {verdict.categoryResults.map((cat, idx) => {
                            const policyCat = verdict.policySnapshot?.categories.find(
                              (c) => c.name === cat.category
                            );
                            return (
                              <div
                                key={cat.category}
                                className="opacity-0 motion-safe:animate-fade-in"
                                style={{ animationDelay: `${idx * 40}ms` }}
                              >
                                <CategoryRow
                                  category={cat.category}
                                  classification={
                                    cat.classification as
                                      | 'detected'
                                      | 'not_detected'
                                  }
                                  confidenceScore={cat.confidenceScore}
                                  reasoning={cat.reasoning}
                                  threshold={policyCat?.confidenceThreshold ?? 80}
                                  enforcement={policyCat?.enforcement ?? 'auto_block'}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(verdict.outcome === 'flagged' ||
                      verdict.outcome === 'blocked') && (
                      <div className="mt-6 flex justify-end">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/history/${result.id}?v=${verdict.id}`}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Dispute this verdict
                          </Link>
                        </Button>
                      </div>
                    )}
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </div>
  );
}
