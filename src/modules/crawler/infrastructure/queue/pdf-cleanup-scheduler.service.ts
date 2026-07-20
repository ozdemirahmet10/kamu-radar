import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  PDF_CLEANUP_CRON,
  PDF_CLEANUP_JOB_NAME,
  PDF_CLEANUP_QUEUE_NAME,
  PDF_CLEANUP_REPEATABLE_JOB_ID,
} from './pdf-cleanup-queue.constants';

/**
 * Uygulama her başladığında, son başvuru tarihi geçen ilanların arşivlenmiş
 * PDF'lerini silen işi günlük tekrarlayan (repeatable) bir BullMQ işi olarak kaydeder.
 */
@Injectable()
export class PdfCleanupSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(PdfCleanupSchedulerService.name);

  constructor(@InjectQueue(PDF_CLEANUP_QUEUE_NAME) private readonly pdfCleanupQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.pdfCleanupQueue.add(
      PDF_CLEANUP_JOB_NAME,
      {},
      {
        jobId: PDF_CLEANUP_REPEATABLE_JOB_ID,
        repeat: { pattern: PDF_CLEANUP_CRON },
        removeOnComplete: 10,
        removeOnFail: 10,
      },
    );
    this.logger.log(`PDF temizleme işi zamanlandı (${PDF_CLEANUP_CRON}).`);
  }
}
