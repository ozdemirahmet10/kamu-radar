import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigService } from '@app/config';
import { IdentityModule } from '../identity/identity.module';
import { CrawlerModule } from '../crawler/crawler.module';

import { DATABASE_DUMP_SERVICE } from './application/ports/database-dump.port';
import { PgDumpService } from './infrastructure/pg-dump.service';
import { RunDatabaseBackupUseCase } from './application/use-cases/run-database-backup.use-case';
import { DATABASE_BACKUP_QUEUE_NAME } from './infrastructure/queue/database-backup-queue.constants';
import { DatabaseBackupProcessor } from './infrastructure/queue/database-backup.processor';
import { DatabaseBackupSchedulerService } from './infrastructure/queue/database-backup-scheduler.service';
import { AdminBackupController } from './presentation/controllers/admin-backup.controller';

@Module({
  imports: [
    IdentityModule,
    CrawlerModule,
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        connection: configService.redis,
      }),
    }),
    BullModule.registerQueue({ name: DATABASE_BACKUP_QUEUE_NAME }),
  ],
  controllers: [AdminBackupController],
  providers: [
    { provide: DATABASE_DUMP_SERVICE, useClass: PgDumpService },
    RunDatabaseBackupUseCase,
    DatabaseBackupProcessor,
    DatabaseBackupSchedulerService,
  ],
})
export class BackupModule {}
