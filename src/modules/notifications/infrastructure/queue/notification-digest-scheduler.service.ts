import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NOTIFICATION_DIGEST_CRON,
  NOTIFICATION_DIGEST_JOB_NAME,
  NOTIFICATION_DIGEST_QUEUE_NAME,
  NOTIFICATION_DIGEST_REPEATABLE_JOB_ID,
} from './notification-digest-queue.constants';

/**
 * Uygulama her başladığında, günlük özet tercih eden kullanıcılara e-posta gönderen
 * işi tekrarlayan (repeatable) bir BullMQ işi olarak kaydeder.
 */
@Injectable()
export class NotificationDigestSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(NotificationDigestSchedulerService.name);

  constructor(
    @InjectQueue(NOTIFICATION_DIGEST_QUEUE_NAME) private readonly notificationDigestQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.notificationDigestQueue.add(
      NOTIFICATION_DIGEST_JOB_NAME,
      {},
      {
        jobId: NOTIFICATION_DIGEST_REPEATABLE_JOB_ID,
        repeat: { pattern: NOTIFICATION_DIGEST_CRON },
        removeOnComplete: 10,
        removeOnFail: 10,
      },
    );
    this.logger.log(`Günlük e-posta özeti işi zamanlandı (${NOTIFICATION_DIGEST_CRON}).`);
  }
}
