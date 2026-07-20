import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@app/database';
import { JwtAuthGuard } from '../../modules/identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/identity/presentation/guards/roles.guard';
import { Roles } from '../../modules/identity/presentation/decorators/roles.decorator';
import { UserRole } from '../../modules/identity/domain/entities/user.entity';

@ApiTags('admin/dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async stats() {
    const [
      totalUsers,
      suspendedUsers,
      deletedUsers,
      jobPostingsByStatus,
      totalCrawlSources,
      activeCrawlSources,
      lastFailedCrawlRuns,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { suspendedAt: { not: null } } }),
      this.prisma.user.count({ where: { deletedAt: { not: null } } }),
      this.prisma.jobPosting.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.crawlSource.count(),
      this.prisma.crawlSource.count({ where: { isActive: true } }),
      this.prisma.crawlRun.count({ where: { status: 'FAILED' } }),
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
      },
    };
  }
}
