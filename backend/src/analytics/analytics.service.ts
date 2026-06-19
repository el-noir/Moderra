import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Submission } from '../submissions/schemas/submission.schema';
import { ImageVerdict } from '../verdicts/schemas/image-verdict.schema';
import { Appeal } from '../appeals/schemas/appeal.schema';
import { User } from '../users/schemas/user.schema';
import {
  APPEAL_STATUSES,
} from '../common/constants/appeal.constants';
import {
  VERDICT_OUTCOMES,
} from '../common/constants/verdict.constants';
import { GetAnalyticsDto } from './dto/get-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<any>,
    @InjectModel(ImageVerdict.name)
    private readonly verdictModel: Model<any>,
    @InjectModel(Appeal.name)
    private readonly appealModel: Model<any>,
    @InjectModel(User.name)
    private readonly userModel: Model<any>,
  ) {}

  async getAnalytics(query: GetAnalyticsDto) {
    const [
      submissionsOverTime,
      verdictDistribution,
      appealStats,
      userRankings,
    ] = await Promise.all([
      this.getSubmissionsOverTime(query),
      this.getVerdictDistribution(),
      this.getAppealStats(),
      this.getUserRankings(),
    ]);

    return {
      submissionsOverTime,
      verdictDistribution,
      appealStats,
      userRankings,
    };
  }

  // ── 1. Submissions over time ────────────────────────────────────────────────

  private async getSubmissionsOverTime(
    query: GetAnalyticsDto,
  ): Promise<{ date: string; count: number }[]> {
    const matchStage: PipelineStage.Match['$match'] = {};

    if (query.dateFrom || query.dateTo) {
      matchStage.createdAt = {};
      if (query.dateFrom) matchStage.createdAt.$gte = query.dateFrom;
      if (query.dateTo) matchStage.createdAt.$lte = query.dateTo;
    }

    const pipeline: PipelineStage[] = [
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
    ];

    return this.submissionModel.aggregate(pipeline).exec();
  }

  // ── 2. Verdict distribution ────────────────────────────────────────────────

  private async getVerdictDistribution(): Promise<{
    byOutcome: { approved: number; flagged: number; blocked: number };
    byCategory: { category: string; detected: number; notDetected: number }[];
  }> {
    const [byOutcomeRaw, byCategoryRaw] = await Promise.all([
      // Count by outcome value
      this.verdictModel
        .aggregate<{ _id: string; count: number }>([
          { $group: { _id: '$outcome', count: { $sum: 1 } } },
        ])
        .exec(),

      // Unwind categoryResults and pivot on classification
      this.verdictModel
        .aggregate<{
          category: string;
          detected: number;
          notDetected: number;
        }>([
          { $unwind: '$categoryResults' },
          {
            $group: {
              _id: '$categoryResults.category',
              detected: {
                $sum: {
                  $cond: [
                    { $eq: ['$categoryResults.classification', 'detected'] },
                    1,
                    0,
                  ],
                },
              },
              notDetected: {
                $sum: {
                  $cond: [
                    { $eq: ['$categoryResults.classification', 'not_detected'] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              category: '$_id',
              detected: 1,
              notDetected: 1,
            },
          },
        ])
        .exec(),
    ]);

    // Build byOutcome with guaranteed keys
    const byOutcome = {
      approved: 0,
      flagged: 0,
      blocked: 0,
    };
    for (const row of byOutcomeRaw) {
      if (row._id === VERDICT_OUTCOMES.APPROVED) byOutcome.approved = row.count;
      if (row._id === VERDICT_OUTCOMES.FLAGGED) byOutcome.flagged = row.count;
      if (row._id === VERDICT_OUTCOMES.BLOCKED) byOutcome.blocked = row.count;
    }

    return { byOutcome, byCategory: byCategoryRaw };
  }

  // ── 3. Appeal stats ────────────────────────────────────────────────────────

  private async getAppealStats(): Promise<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    resolutionRate: number;
  }> {
    const rows = await this.appealModel
      .aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .exec();

    const counts = { pending: 0, accepted: 0, rejected: 0 };
    for (const row of rows) {
      if (row._id === APPEAL_STATUSES.PENDING) counts.pending = row.count;
      if (row._id === APPEAL_STATUSES.ACCEPTED) counts.accepted = row.count;
      if (row._id === APPEAL_STATUSES.REJECTED) counts.rejected = row.count;
    }

    const total = counts.pending + counts.accepted + counts.rejected;
    const resolved = counts.accepted + counts.rejected;
    const resolutionRate = total === 0 ? 0 : Number((resolved / total).toFixed(4));

    return { total, ...counts, resolutionRate };
  }

  // ── 4. User rankings ───────────────────────────────────────────────────────

  private async getUserRankings(): Promise<{
    bySubmissionCount: { userId: string; email: string; count: number }[];
    byViolationCount: { userId: string; email: string; count: number }[];
  }> {
    const [bySubmission, byViolation] = await Promise.all([
      // Top 10 by number of submissions
      this.submissionModel
        .aggregate<any>([
          { $group: { _id: '$userId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
          {
            $project: {
              _id: 0,
              userId: { $toString: '$_id' },
              email: '$user.email',
              count: 1,
            },
          },
        ])
        .exec(),

      // Top 10 by number of flagged + blocked verdicts
      this.verdictModel
        .aggregate<any>([
          {
            $match: {
              outcome: { $in: [VERDICT_OUTCOMES.FLAGGED, VERDICT_OUTCOMES.BLOCKED] },
            },
          },
          { $group: { _id: '$userId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
          {
            $project: {
              _id: 0,
              userId: { $toString: '$_id' },
              email: '$user.email',
              count: 1,
            },
          },
        ])
        .exec(),
    ]);

    return {
      bySubmissionCount: bySubmission,
      byViolationCount: byViolation,
    };
  }
}
