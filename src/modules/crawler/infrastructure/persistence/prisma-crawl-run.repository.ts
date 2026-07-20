import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import {
  CrawlRunRecord,
  ICrawlRunRepository,
} from '../../domain/repositories/crawl-run.repository.interface';
import { CrawlStatus } from '../../domain/repositories/crawl-source.repository.interface';

@Injectable()
export class PrismaCrawlRunRepository implements ICrawlRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async start(sourceId: string): Promise<string> {
    const run = await this.prisma.crawlRun.create({
      data: { sourceId, status: 'PARTIAL' },
    });
    return run.id;
  }

  async complete(
    id: string,
    result: { status: CrawlStatus; itemsFound: number; itemsNew: number; errorMessage?: string },
  ): Promise<void> {
    await this.prisma.crawlRun.update({
      where: { id },
      data: {
        status: result.status,
        itemsFound: result.itemsFound,
        itemsNew: result.itemsNew,
        errorMessage: result.errorMessage,
        finishedAt: new Date(),
      },
    });
  }

  async findRecentBySourceId(sourceId: string, limit: number): Promise<CrawlRunRecord[]> {
    const records = await this.prisma.crawlRun.findMany({
      where: { sourceId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
    return records.map((record) => ({ ...record, status: record.status as CrawlStatus }));
  }

  async findAll(limit: number): Promise<CrawlRunRecord[]> {
    const records = await this.prisma.crawlRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
    return records.map((record) => ({ ...record, status: record.status as CrawlStatus }));
  }
}
