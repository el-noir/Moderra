import React from 'react';

export default function ThemeTestPage() {
  return (
    <div className="p-10 space-y-8">
      <h1 className="text-2xl font-bold">Theme and Token Test Page</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Typography</h2>
        <div className="p-4 border border-border rounded-md bg-card">
          <p className="font-sans text-lg">
            This sentence is rendered in the sans-serif font (Inter).
          </p>
          <p className="font-mono text-lg mt-2 text-muted-foreground">
            This sentence is rendered in the monospace font (JetBrains Mono).
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. Verdict Colors</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border-2 border-verdict-approved-border bg-verdict-approved-bg text-verdict-approved rounded-lg flex items-center justify-center font-mono font-bold tracking-wider">
            APPROVED
          </div>
          <div className="p-4 border-2 border-verdict-flagged-border bg-verdict-flagged-bg text-verdict-flagged rounded-lg flex items-center justify-center font-mono font-bold tracking-wider">
            FLAGGED
          </div>
          <div className="p-4 border-2 border-verdict-blocked-border bg-verdict-blocked-bg text-verdict-blocked rounded-lg flex items-center justify-center font-mono font-bold tracking-wider">
            BLOCKED
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. Shimmer Animation</h2>
        <div className="w-full h-32 rounded-xl bg-gradient-to-r from-muted via-muted-foreground/20 to-muted bg-[length:400%_100%] animate-shimmer" />
      </section>
    </div>
  );
}
