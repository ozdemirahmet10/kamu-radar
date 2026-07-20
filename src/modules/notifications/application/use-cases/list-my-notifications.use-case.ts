import { Inject, Injectable } from '@nestjs/common';
import {
  INotificationRepository,
  ListNotificationsResult,
  NOTIFICATION_REPOSITORY,
} from '../../domain/repositories/notification.repository.interface';
import { SyncNotificationsUseCase } from './sync-notifications.use-case';

export interface ListMyNotificationsInput {
  userId: string;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListMyNotificationsUseCase {
  constructor(
    private readonly syncNotificationsUseCase: SyncNotificationsUseCase,
    @Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(input: ListMyNotificationsInput): Promise<ListNotificationsResult> {
    await this.syncNotificationsUseCase.execute(input.userId);
    return this.notificationRepository.list(input.userId, input.page, input.pageSize);
  }
}
