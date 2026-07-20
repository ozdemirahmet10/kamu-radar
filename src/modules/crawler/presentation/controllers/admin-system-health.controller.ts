import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@app/database';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { UserRole } from '../../../identity/domain/entities/user.entity';
import { RAW_CONTENT_STORE, IRawContentStore } from '../../application/ports/raw-content-store.port';
import { CRAWL_QUEUE_NAME } from '../../infrastructure/queue/crawl-queue.constants';

interface ComponentHealth {
  status: 'ok' | 'error';
  latencyMs: number | null;
  error?: string;
}

@ApiTags('admin/system-health')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/system-health')
export class AdminSystemHealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(RAW_CONTENT_STORE) private readonly rawContentStore: IRawContentStore,
    @InjectQueue(CRAWL_QUEUE_NAME) private readonly crawlQueue: Queue,
  ) {}

  @Get()
  async check() {
    const [database, redis, minio, jobCounts] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMinio(),
      this.crawlQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed').catch(() => null),
    ]);

    return {
      database,
      redis,
      minio,
      queue: jobCounts ?? { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
      checkedAt: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (error) {
      return { status: 'error', latencyMs: null, error: (error as Error).message };
    }
  }

  private async checkRedis(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await this.crawlQueue.getJobCounts();
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (error) {
      return { status: 'error', latencyMs: null, error: (error as Error).message };
    }
  }

  private async checkMinio(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const healthy = await this.rawContentStore.checkHealth();
      return healthy
        ? { status: 'ok', latencyMs: Date.now() - start }
        : { status: 'error', latencyMs: null, error: 'Bucket erişilemedi' };
    } catch (error) {
      return { status: 'error', latencyMs: null, error: (error as Error).message };
    }
  }
}
