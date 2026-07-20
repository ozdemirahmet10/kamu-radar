import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import {
  CreateCrawlSourceParams,
  CrawlSourceRecord,
  CrawlStatus,
  ICrawlSourceRepository,
  UpdateCrawlSourceParams,
} from '../../domain/repositories/crawl-source.repository.interface';

@Injectable()
export class PrismaCrawlSourceRepository implements ICrawlSourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CrawlSourceRecord | null> {
    const record = await this.prisma.crawlSource.findUnique({ where: { id } });
    return record ? this.toRecord(record) : null;
  }

  async findByAdapterKey(adapterKey: string): Promise<CrawlSourceRecord | null> {
    const record = await this.prisma.crawlSource.findFirst({ where: { adapterKey } });
    return record ? this.toRecord(record) : null;
  }

  async findAllActive(): Promise<CrawlSourceRecord[]> {
    const records = await this.prisma.crawlSource.findMany({ where: { isActive: true } });
    return records.map((record) => this.toRecord(record));
  }

  async findAll(): Promise<CrawlSourceRecord[]> {
    const records = await this.prisma.crawlSource.findMany({ orderBy: { name: 'asc' } });
    return records.map((record) => this.toRecord(record));
  }

  async updateLastCrawlStatus(id: string, status: CrawlStatus, crawledAt: Date): Promise<void> {
    await this.prisma.crawlSource.update({
      where: { id },
      data: { lastStatus: status, lastCrawledAt: crawledAt },
    });
  }

  async create(params: CreateCrawlSourceParams): Promise<CrawlSourceRecord> {
    const record = await this.prisma.crawlSource.create({ data: params });
    return this.toRecord(record);
  }

  async update(id: string, params: UpdateCrawlSourceParams): Promise<CrawlSourceRecord> {
    const record = await this.prisma.crawlSource.update({ where: { id }, data: params });
    return this.toRecord(record);
  }

  private toRecord(record: {
    id: string;
    name: string;
    baseUrl: string;
    adapterKey: string;
    crawlFrequencyCron: string;
    isActive: boolean;
    lastCrawledAt: Date | null;
    lastStatus: string | null;
  }): CrawlSourceRecord {
    return {
      id: record.id,
      name: record.name,
      baseUrl: record.baseUrl,
      adapterKey: record.adapterKey,
      crawlFrequencyCron: record.crawlFrequencyCron,
      isActive: record.isActive,
      lastCrawledAt: record.lastCrawledAt,
      lastStatus: record.lastStatus as CrawlStatus | null,
    };
  }
}
