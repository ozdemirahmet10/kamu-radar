import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import {
  IMatchFeedbackRepository,
  MatchFeedbackRecord,
  MatchFeedbackStats,
  MyMatchFeedbackRecord,
} from '../domain/repositories/match-feedback.repository.interface';

@Injectable()
export class PrismaMatchFeedbackRepository implements IMatchFeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async submit(
    userId: string,
    jobPostingId: string,
    isAccurate: boolean,
    reason: string | null,
  ): Promise<void> {
    await this.prisma.matchFeedback.upsert({
      where: { userId_jobPostingId: { userId, jobPostingId } },
      create: { userId, jobPostingId, isAccurate, reason },
      update: { isAccurate, reason },
    });
  }

  async getStats(): Promise<MatchFeedbackStats> {
    const [accurate, inaccurate] = await Promise.all([
      this.prisma.matchFeedback.count({ where: { isAccurate: true } }),
      this.prisma.matchFeedback.count({ where: { isAccurate: false } }),
    ]);
    return { accurate, inaccurate };
  }

  async listRecent(limit: number): Promise<MatchFeedbackRecord[]> {
    return this.prisma.matchFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        userId: true,
        jobPostingId: true,
        isAccurate: true,
        reason: true,
        createdAt: true,
      },
    });
  }

  async listByUser(userId: string): Promise<MyMatchFeedbackRecord[]> {
    return this.prisma.matchFeedback.findMany({
      where: { userId },
      select: { jobPostingId: true, isAccurate: true },
    });
  }
}
