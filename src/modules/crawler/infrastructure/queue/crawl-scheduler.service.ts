import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  CRAWL_SOURCE_REPOSITORY,
  ICrawlSourceRepository,
} from '../../domain/repositories/crawl-source.repository.interface';
import { CRAWL_JOB_NAME, CRAWL_QUEUE_NAME, CrawlJobData } from './crawl-queue.constants';

const SCHEDULED_JOB_PREFIX = 'scheduled-source-';
const SCHEDULED_MAX_ITEMS = 100;

/**
 * Uygulama her başladığında (hem API hem worker process'inde), veritabanındaki
 * aktif crawl_sources kayıtlarını okur ve her biri için kendi crawlFrequencyCron
 * değerine göre BullMQ'da tekrarlayan (repeatable) bir iş kaydeder. Böylece admin'in
 * taramayı elle tetiklemesine gerek kalmaz — kaynak eklendiğinde/frekansı
 * değiştiğinde bir sonraki yeniden başlatmada otomatik olarak yansır.
 */
@Injectable()
export class CrawlSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(CrawlSchedulerService.name);

  constructor(
    @InjectQueue(CRAWL_QUEUE_NAME) private readonly crawlQueue: Queue<CrawlJobData>,
    @Inject(CRAWL_SOURCE_REPOSITORY) private readonly crawlSourceRepository: ICrawlSourceRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.syncSchedules();
  }

  /**
   * Veritabanındaki aktif kaynaklarla BullMQ'daki tekrarlayan işleri yeniden
   * senkronize eder. Uygulama başlangıcında olduğu kadar, admin panelinden bir
   * kaynak eklendiğinde/güncellendiğinde de çağrılır ki değişiklik yeniden
   * başlatma beklemeden anında etkili olsun.
   */
  async syncSchedules(): Promise<void> {
    const activeSources = await this.crawlSourceRepository.findAllActive();
    const validSources = activeSources.filter((source) => source.crawlFrequencyCron?.trim());

    const existingRepeatables = await this.crawlQueue.getRepeatableJobs();
    const currentJobIds = new Set(validSources.map((s) => `${SCHEDULED_JOB_PREFIX}${s.id}`));

    for (const repeatable of existingRepeatables) {
      if (
        repeatable.key.startsWith(SCHEDULED_JOB_PREFIX) &&
        repeatable.id &&
        !currentJobIds.has(repeatable.id)
      ) {
        await this.crawlQueue.removeRepeatableByKey(repeatable.key);
        this.logger.log(
          `Artık aktif olmayan kaynak için zamanlanmış tarama kaldırıldı: ${repeatable.id}`,
        );
      }
    }

    for (const source of validSources) {
      const jobId = `${SCHEDULED_JOB_PREFIX}${source.id}`;
      await this.crawlQueue.add(
        CRAWL_JOB_NAME,
        { sourceId: source.id, maxItems: SCHEDULED_MAX_ITEMS },
        {
          jobId,
          repeat: { pattern: source.crawlFrequencyCron },
          removeOnComplete: 20,
          removeOnFail: 20,
        },
      );
      this.logger.log(
        `Zamanlanmış tarama kaydedildi: ${source.name} (${source.crawlFrequencyCron})`,
      );
    }
  }
}
