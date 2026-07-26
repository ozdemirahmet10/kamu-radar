import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { EligibilityStatus } from '../domain/entities/eligibility-result';
import {
  IMatchResultRepository,
  MatchResultRecord,
} from '../domain/repositories/match-result.repository.interface';

@Injectable()
export class PrismaMatchResultRepository implements IMatchResultRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    userId: string,
    jobPostingId: string,
    status: EligibilityStatus,
    missingCriteria: string[],
  ): Promise<void> {
    await this.prisma.matchResult.upsert({
      where: { userId_jobPostingId: { userId, jobPostingId } },
      create: {
        userId,
        jobPostingId,
        eligibilityStatus: status,
        missingCriteria,
        calculatedAt: new Date(),
      },
      update: {
        eligibilityStatus: status,
        missingCriteria,
        calculatedAt: new Date(),
      },
    });
  }

  async findByUserId(userId: string): Promise<MatchResultRecord[]> {
    const records = await this.prisma.matchResult.findMany({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
    });

    return records.map((record) => ({
      jobPostingId: record.jobPostingId,
      eligibilityStatus: record.eligibilityStatus as EligibilityStatus,
      missingCriteria: (record.missingCriteria as string[] | null) ?? [],
      calculatedAt: record.calculatedAt,
    }));
  }
}
