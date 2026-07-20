import { Inject, Injectable } from '@nestjs/common';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../../domain/repositories/notification.repository.interface';
import { SyncNotificationsUseCase } from './sync-notifications.use-case';

@Injectable()
export class GetUnreadNotificationCountUseCase {
  constructor(
    private readonly syncNotificationsUseCase: SyncNotificationsUseCase,
    @Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(userId: string): Promise<number> {
    await this.syncNotificationsUseCase.execute(userId);
    return this.notificationRepository.countUnread(userId);
  }
}
