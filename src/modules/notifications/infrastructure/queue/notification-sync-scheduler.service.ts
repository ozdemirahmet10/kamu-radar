import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NOTIFICATION_SYNC_CRON,
  NOTIFICATION_SYNC_JOB_NAME,
  NOTIFICATION_SYNC_QUEUE_NAME,
  NOTIFICATION_SYNC_REPEATABLE_JOB_ID,
} from './notification-sync-queue.constants';

/**
 * Uygulama her başladığında, tüm kullanıcılar için bildirim (in-app + e-posta)
 * senkronizasyonunu tekrarlayan (repeatable) bir BullMQ işi olarak kaydeder.
 */
@Injectable()
export class NotificationSyncSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(NotificationSyncSchedulerService.name);

  constructor(
    @InjectQueue(NOTIFICATION_SYNC_QUEUE_NAME) private readonly notificationSyncQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.notificationSyncQueue.add(
      NOTIFICATION_SYNC_JOB_NAME,
      {},
      {
        jobId: NOTIFICATION_SYNC_REPEATABLE_JOB_ID,
        repeat: { pattern: NOTIFICATION_SYNC_CRON },
        removeOnComplete: 10,
        removeOnFail: 10,
      },
    );
    this.logger.log(`Bildirim senkronizasyon işi zamanlandı (${NOTIFICATION_SYNC_CRON}).`);
  }
}
