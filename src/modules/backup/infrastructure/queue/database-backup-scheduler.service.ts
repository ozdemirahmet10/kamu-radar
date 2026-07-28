import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  DATABASE_BACKUP_CRON,
  DATABASE_BACKUP_JOB_NAME,
  DATABASE_BACKUP_QUEUE_NAME,
  DATABASE_BACKUP_REPEATABLE_JOB_ID,
} from './database-backup-queue.constants';

/** Uygulama her başladığında, günlük veritabanı yedeğini alan işi tekrarlayan bir BullMQ işi olarak kaydeder. */
@Injectable()
export class DatabaseBackupSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseBackupSchedulerService.name);

  constructor(@InjectQueue(DATABASE_BACKUP_QUEUE_NAME) private readonly backupQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.backupQueue.add(
      DATABASE_BACKUP_JOB_NAME,
      {},
      {
        jobId: DATABASE_BACKUP_REPEATABLE_JOB_ID,
        repeat: { pattern: DATABASE_BACKUP_CRON },
        removeOnComplete: 10,
        removeOnFail: 10,
      },
    );
    this.logger.log(`Veritabanı yedekleme işi zamanlandı (${DATABASE_BACKUP_CRON}).`);
  }
}
