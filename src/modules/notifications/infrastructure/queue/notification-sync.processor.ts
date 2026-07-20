import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { SyncAllUsersNotificationsUseCase } from '../../application/use-cases/sync-all-users-notifications.use-case';
import { NOTIFICATION_SYNC_QUEUE_NAME } from './notification-sync-queue.constants';

@Processor(NOTIFICATION_SYNC_QUEUE_NAME)
export class NotificationSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationSyncProcessor.name);

  constructor(private readonly syncAllUsersNotificationsUseCase: SyncAllUsersNotificationsUseCase) {
    super();
  }

  async process(): Promise<void> {
    this.logger.log('Tüm kullanıcılar için bildirim senkronizasyonu başlıyor.');
    const { usersProcessed } = await this.syncAllUsersNotificationsUseCase.execute();
    this.logger.log(`Bildirim senkronizasyonu tamamlandı: ${usersProcessed} kullanıcı işlendi.`);
  }
}
