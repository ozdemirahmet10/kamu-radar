import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigService } from '@app/config';
import { EmailModule } from '@app/email';
import { IdentityModule } from '../identity/identity.module';
import { MatchingModule } from '../matching/matching.module';

import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository.interface';
import { NOTIFICATION_PREFERENCE_REPOSITORY } from './domain/repositories/notification-preference.repository.interface';
import { PrismaNotificationRepository } from './infrastructure/prisma-notification.repository';
import { PrismaNotificationPreferenceRepository } from './infrastructure/prisma-notification-preference.repository';
import { SyncNotificationsUseCase } from './application/use-cases/sync-notifications.use-case';
import { SyncAllUsersNotificationsUseCase } from './application/use-cases/sync-all-users-notifications.use-case';
import { ListMyNotificationsUseCase } from './application/use-cases/list-my-notifications.use-case';
import { MarkNotificationReadUseCase } from './application/use-cases/mark-notification-read.use-case';
import { MarkAllNotificationsReadUseCase } from './application/use-cases/mark-all-notifications-read.use-case';
import { GetUnreadNotificationCountUseCase } from './application/use-cases/get-unread-notification-count.use-case';
import { GetNotificationPreferenceUseCase } from './application/use-cases/get-notification-preference.use-case';
import { UpdateNotificationPreferenceUseCase } from './application/use-cases/update-notification-preference.use-case';
import { NOTIFICATION_SYNC_QUEUE_NAME } from './infrastructure/queue/notification-sync-queue.constants';
import { NotificationSyncProcessor } from './infrastructure/queue/notification-sync.processor';
import { NotificationSyncSchedulerService } from './infrastructure/queue/notification-sync-scheduler.service';
import { MeNotificationsController } from './presentation/controllers/me-notifications.controller';

@Module({
  imports: [
    IdentityModule,
    MatchingModule,
    EmailModule,
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        connection: configService.redis,
      }),
    }),
    BullModule.registerQueue({ name: NOTIFICATION_SYNC_QUEUE_NAME }),
  ],
  controllers: [MeNotificationsController],
  providers: [
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    { provide: NOTIFICATION_PREFERENCE_REPOSITORY, useClass: PrismaNotificationPreferenceRepository },
    SyncNotificationsUseCase,
    SyncAllUsersNotificationsUseCase,
    ListMyNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    GetUnreadNotificationCountUseCase,
    GetNotificationPreferenceUseCase,
    UpdateNotificationPreferenceUseCase,
    NotificationSyncProcessor,
    NotificationSyncSchedulerService,
  ],
})
export class NotificationsModule {}
