import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  POSTING_EXPIRY_CRON,
  POSTING_EXPIRY_JOB_NAME,
  POSTING_EXPIRY_QUEUE_NAME,
  POSTING_EXPIRY_REPEATABLE_JOB_ID,
} from './posting-expiry-queue.constants';

/** Uygulama her başladığında, son başvuru tarihi geçen ilanları EXPIRED yapan işi saatlik tekrarlayan bir BullMQ işi olarak kaydeder. */
@Injectable()
export class PostingExpirySchedulerService implements OnModuleInit {
  private readonly logger = new Logger(PostingExpirySchedulerService.name);

  constructor(@InjectQueue(POSTING_EXPIRY_QUEUE_NAME) private readonly postingExpiryQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.postingExpiryQueue.add(
      POSTING_EXPIRY_JOB_NAME,
      {},
      {
        jobId: POSTING_EXPIRY_REPEATABLE_JOB_ID,
        repeat: { pattern: POSTING_EXPIRY_CRON },
        removeOnComplete: 10,
        removeOnFail: 10,
      },
    );
    this.logger.log(`İlan süresi güncelleme işi zamanlandı (${POSTING_EXPIRY_CRON}).`);
  }
}
