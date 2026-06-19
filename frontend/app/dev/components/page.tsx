'use client';

import React, { useState } from 'react';
import {
  VerdictBadge,
  ConfidenceBar,
  CategoryRow,
  AppealStatusTimeline,
  PolicyCategoryRow,
} from '@/components/moderation';

export default function ComponentsDevPage() {
  const [dummyPolicy, setDummyPolicy] = useState({
    name: 'Violence',
    enabled: true,
    confidenceThreshold: 80,
    enforcement: 'auto_block' as const,
  });

  return (
    <div className="p-10 space-y-16 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold border-b pb-4">
        Moderation Components Sandbox
      </h1>

      {/* 1. VerdictBadge */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">1. VerdictBadge</h2>
        <div className="grid grid-cols-4 gap-6">
          {(['approved', 'flagged', 'blocked', 'pending'] as const).map(
            (outcome) => (
              <div key={outcome} className="space-y-4">
                <VerdictBadge outcome={outcome} size="sm" />
                <br />
                <VerdictBadge outcome={outcome} size="md" />
                <br />
                <VerdictBadge outcome={outcome} size="lg" />
              </div>
            )
          )}
        </div>
      </section>

      {/* 2. ConfidenceBar */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">2. ConfidenceBar</h2>
        <div className="space-y-8 bg-card p-6 border rounded-lg">
          <div>
            <h3 className="text-sm font-medium mb-4 text-muted-foreground">
              Auto Block (Threshold: 80)
            </h3>
            <div className="space-y-6">
              <ConfidenceBar score={40} threshold={80} enforcement="auto_block" />
              <ConfidenceBar score={80} threshold={80} enforcement="auto_block" />
              <ConfidenceBar score={95} threshold={80} enforcement="auto_block" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-4 text-muted-foreground">
              Flag for Review (Threshold: 60)
            </h3>
            <div className="space-y-6">
              <ConfidenceBar
                score={30}
                threshold={60}
                enforcement="flag_for_review"
              />
              <ConfidenceBar
                score={60}
                threshold={60}
                enforcement="flag_for_review"
              />
              <ConfidenceBar
                score={85}
                threshold={60}
                enforcement="flag_for_review"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. CategoryRow */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">3. CategoryRow</h2>
        <div className="space-y-2 bg-card p-4 border rounded-lg">
          <CategoryRow
            category="Weapons (Detected + Triggered Block)"
            classification="detected"
            confidenceScore={90}
            threshold={80}
            enforcement="auto_block"
            reasoning="Looks like a weapon"
          />
          <CategoryRow
            category="Nudity (Detected + Triggered Flag)"
            classification="detected"
            confidenceScore={75}
            threshold={60}
            enforcement="flag_for_review"
            reasoning="Possible nudity"
          />
          <CategoryRow
            category="Drugs (Detected but below threshold)"
            classification="detected"
            confidenceScore={40}
            threshold={80}
            enforcement="auto_block"
            reasoning="Low confidence drug paraphernalia"
          />
          <CategoryRow
            category="Hate Speech (Not Detected)"
            classification="not_detected"
            confidenceScore={5}
            threshold={80}
            enforcement="auto_block"
            reasoning="Nothing found"
          />
        </div>
      </section>

      {/* 4. AppealStatusTimeline */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">4. AppealStatusTimeline</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="p-6 bg-card border rounded-lg">
            <h3 className="text-sm font-medium mb-6">Pending</h3>
            <AppealStatusTimeline
              createdAt={new Date(Date.now() - 1000 * 60 * 60).toISOString()}
              status="pending"
            />
          </div>
          <div className="p-6 bg-card border rounded-lg">
            <h3 className="text-sm font-medium mb-6">Accepted</h3>
            <AppealStatusTimeline
              createdAt={new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()}
              status="accepted"
              reviewedAt={new Date(Date.now() - 1000 * 60 * 30).toISOString()}
              adminResponse="Reviewed manually. The image is benign and was a false positive."
            />
          </div>
          <div className="p-6 bg-card border rounded-lg">
            <h3 className="text-sm font-medium mb-6">Rejected</h3>
            <AppealStatusTimeline
              createdAt={new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()}
              status="rejected"
              reviewedAt={new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()}
              // No admin response
            />
          </div>
        </div>
      </section>

      {/* 5. PolicyCategoryRow */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">5. PolicyCategoryRow</h2>
        <div className="space-y-4">
          <PolicyCategoryRow
            category={{
              name: 'Weapons (Enabled, Unmodified)',
              enabled: true,
              confidenceThreshold: 90,
              enforcement: 'auto_block',
            }}
            modified={false}
            onChange={() => {}}
          />
          <PolicyCategoryRow
            category={dummyPolicy}
            modified={true}
            onChange={setDummyPolicy}
          />
          <PolicyCategoryRow
            category={{
              name: 'Hate Symbols (Disabled)',
              enabled: false,
              confidenceThreshold: 85,
              enforcement: 'flag_for_review',
            }}
            modified={false}
            onChange={() => {}}
          />
        </div>
      </section>
    </div>
  );
}
