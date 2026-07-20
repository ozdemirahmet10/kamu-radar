import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RunCrawlForSourceUseCase } from '../../application/use-cases/run-crawl-for-source.use-case';
import { CRAWL_QUEUE_NAME, CrawlJobData } from './crawl-queue.constants';

@Processor(CRAWL_QUEUE_NAME)
export class CrawlProcessor extends WorkerHost {
  private readonly logger = new Logger(CrawlProcessor.name);

  constructor(private readonly runCrawlForSourceUseCase: RunCrawlForSourceUseCase) {
    super();
  }

  async process(job: Job<CrawlJobData>): Promise<void> {
    this.logger.log(`Zamanlanmış tarama başlıyor: kaynak=${job.data.sourceId}`);
    const result = await this.runCrawlForSourceUseCase.execute(
      job.data.sourceId,
      job.data.maxItems,
    );
    this.logger.log(
      `Tarama tamamlandı: kaynak=${job.data.sourceId} bulunan=${result.itemsFound} yeni=${result.itemsNew} atlanan=${result.itemsSkipped} hatalı=${result.itemsFailed}`,
    );
  }
}
