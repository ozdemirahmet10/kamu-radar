import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@app/database';
import { JwtAuthGuard } from '../../modules/identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/identity/presentation/guards/roles.guard';
import { Roles } from '../../modules/identity/presentation/decorators/roles.decorator';
import { UserRole } from '../../modules/identity/domain/entities/user.entity';

const TREND_DAYS = 14;
const CRAWL_WINDOW_DAYS = 7;

interface DailyCountRow {
  day: Date;
  count: bigint;
}

@ApiTags('admin/dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async stats() {
    const trendSince = new Date(Date.now() - (TREND_DAYS - 1) * 24 * 60 * 60 * 1000);
    const crawlWindowSince = new Date(Date.now() - CRAWL_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      suspendedUsers,
      deletedUsers,
      jobPostingsByStatus,
      totalCrawlSources,
      activeCrawlSources,
      lastFailedCrawlRuns,
      matchesByStatus,
      crawlRunsByStatusLast7Days,
      newUsersByDay,
      newJobPostingsByDay,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { suspendedAt: { not: null } } }),
      this.prisma.user.count({ where: { deletedAt: { not: null } } }),
      this.prisma.jobPosting.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.crawlSource.count(),
      this.prisma.crawlSource.count({ where: { isActive: true } }),
      this.prisma.crawlRun.count({ where: { status: 'FAILED' } }),
      this.prisma.matchResult.groupBy({ by: ['eligibilityStatus'], _count: { _all: true } }),
      this.prisma.crawlRun.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: { startedAt: { gte: crawlWindowSince } },
      }),
      this.prisma.$queryRaw<DailyCountRow[]>(
        Prisma.sql`SELECT date_trunc('day', "created_at") AS day, COUNT(*)::bigint AS count
          FROM users WHERE "created_at" >= ${trendSince}
          GROUP BY day ORDER BY day`,
      ),
      this.prisma.$queryRaw<DailyCountRow[]>(
        Prisma.sql`SELECT date_trunc('day', "created_at") AS day, COUNT(*)::bigint AS count
          FROM job_postings WHERE "created_at" >= ${trendSince}
          GROUP BY day ORDER BY day`,
      ),
    ]);

    const statusCounts: Record<string, number> = {
      DRAFT: 0,
      PUBLISHED: 0,
      EXPIRED: 0,
      ARCHIVED: 0,
      PENDING_REVIEW: 0,
    };
    for (const row of jobPostingsByStatus) {
      statusCounts[row.status] = row._count._all;
    }

    const matchCounts: Record<string, number> = {
      ELIGIBLE: 0,
      PARTIALLY_ELIGIBLE: 0,
      NOT_ELIGIBLE: 0,
    };
    for (const row of matchesByStatus) {
      matchCounts[row.eligibilityStatus] = row._count._all;
    }

    const crawlRunCounts: Record<string, number> = { SUCCESS: 0, FAILED: 0, PARTIAL: 0 };
    for (const row of crawlRunsByStatusLast7Days) {
      crawlRunCounts[row.status] = row._count._all;
    }
    const crawlRunTotalLast7Days =
      crawlRunCounts.SUCCESS + crawlRunCounts.FAILED + crawlRunCounts.PARTIAL;

    return {
      users: {
        total: totalUsers,
        suspended: suspendedUsers,
        deleted: deletedUsers,
        active: totalUsers - suspendedUsers - deletedUsers,
      },
      jobPostings: {
        total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
        byStatus: statusCounts,
      },
      crawler: {
        totalSources: totalCrawlSources,
        activeSources: activeCrawlSources,
        failedRuns: lastFailedCrawlRuns,
        last7Days: {
          total: crawlRunTotalLast7Days,
          successful: crawlRunCounts.SUCCESS,
          partial: crawlRunCounts.PARTIAL,
          failed: crawlRunCounts.FAILED,
          successRate:
            crawlRunTotalLast7Days === 0
              ? null
              : Math.round((crawlRunCounts.SUCCESS / crawlRunTotalLast7Days) * 100),
        },
      },
      matches: matchCounts,
      trends: {
        days: TREND_DAYS,
        newUsers: fillDailyTrend(newUsersByDay, trendSince, TREND_DAYS),
        newJobPostings: fillDailyTrend(newJobPostingsByDay, trendSince, TREND_DAYS),
      },
    };
  }
}

function fillDailyTrend(
  rows: DailyCountRow[],
  since: Date,
  days: number,
): Array<{ date: string; count: number }> {
  const countsByDate = new Map<string, number>();
  for (const row of rows) {
    countsByDate.set(row.day.toISOString().slice(0, 10), Number(row.count));
  }

  const result: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().slice(0, 10);
    result.push({ date: dateKey, count: countsByDate.get(dateKey) ?? 0 });
  }
  return result;
}
