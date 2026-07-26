import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigService } from '@app/config';
import { EmailModule } from '@app/email';
import { IdentityModule } from '../identity/identity.module';
import { MatchingModule } from '../matching/matching.module';

import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository.interface';
import { NOTIFICATION_PREFERENCE_REPOSITORY } from './domain/repositories/notification-preference.repository.interface';
import { PUSH_SUBSCRIPTION_REPOSITORY } from './domain/repositories/push-subscription.repository.interface';
import { PUSH_SENDER } from './application/ports/push-sender.port';
import { PrismaNotificationRepository } from './infrastructure/prisma-notification.repository';
import { PrismaNotificationPreferenceRepository } from './infrastructure/prisma-notification-preference.repository';
import { PrismaPushSubscriptionRepository } from './infrastructure/prisma-push-subscription.repository';
import { WebPushSender } from './infrastructure/web-push-sender.service';
import { SyncNotificationsUseCase } from './application/use-cases/sync-notifications.use-case';
import { SubscribePushUseCase } from './application/use-cases/subscribe-push.use-case';
import { UnsubscribePushUseCase } from './application/use-cases/unsubscribe-push.use-case';
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
import { NOTIFICATION_DIGEST_QUEUE_NAME } from './infrastructure/queue/notification-digest-queue.constants';
import { NotificationDigestProcessor } from './infrastructure/queue/notification-digest.processor';
import { NotificationDigestSchedulerService } from './infrastructure/queue/notification-digest-scheduler.service';
import { DailyEmailDigestUseCase } from './application/use-cases/daily-email-digest.use-case';
import { MeNotificationsController } from './presentation/controllers/me-notifications.controller';
import { MePushController } from './presentation/controllers/me-push.controller';
import { PushConfigController } from './presentation/controllers/push-config.controller';

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
    BullModule.registerQueue(
      { name: NOTIFICATION_SYNC_QUEUE_NAME },
      { name: NOTIFICATION_DIGEST_QUEUE_NAME },
    ),
  ],
  controllers: [MeNotificationsController, MePushController, PushConfigController],
  providers: [
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    { provide: NOTIFICATION_PREFERENCE_REPOSITORY, useClass: PrismaNotificationPreferenceRepository },
    { provide: PUSH_SUBSCRIPTION_REPOSITORY, useClass: PrismaPushSubscriptionRepository },
    { provide: PUSH_SENDER, useClass: WebPushSender },
    SyncNotificationsUseCase,
    SyncAllUsersNotificationsUseCase,
    ListMyNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    GetUnreadNotificationCountUseCase,
    GetNotificationPreferenceUseCase,
    UpdateNotificationPreferenceUseCase,
    SubscribePushUseCase,
    UnsubscribePushUseCase,
    NotificationSyncProcessor,
    NotificationSyncSchedulerService,
    DailyEmailDigestUseCase,
    NotificationDigestProcessor,
    NotificationDigestSchedulerService,
  ],
  exports: [NOTIFICATION_REPOSITORY, NOTIFICATION_PREFERENCE_REPOSITORY, PUSH_SUBSCRIPTION_REPOSITORY],
})
export class NotificationsModule {}
