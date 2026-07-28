import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { RunDatabaseBackupUseCase } from '../../application/use-cases/run-database-backup.use-case';
import { DATABASE_BACKUP_QUEUE_NAME } from './database-backup-queue.constants';

@Processor(DATABASE_BACKUP_QUEUE_NAME)
export class DatabaseBackupProcessor extends WorkerHost {
  private readonly logger = new Logger(DatabaseBackupProcessor.name);

  constructor(private readonly runDatabaseBackupUseCase: RunDatabaseBackupUseCase) {
    super();
  }

  async process(): Promise<void> {
    this.logger.log('Veritabanı yedekleme işi başlıyor.');
    try {
      const result = await this.runDatabaseBackupUseCase.execute();
      this.logger.log(
        `Yedekleme tamamlandı: ${result.key} (${result.sizeBytes} byte), ${result.prunedCount} eski yedek silindi.`,
      );
    } catch (error) {
      this.logger.error(`Yedekleme başarısız oldu: ${(error as Error).message}`);
      throw error;
    }
  }
}
