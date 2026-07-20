import { Inject, Injectable } from '@nestjs/common';
import {
  INotificationPreferenceRepository,
  NOTIFICATION_PREFERENCE_REPOSITORY,
} from '../../domain/repositories/notification-preference.repository.interface';

@Injectable()
export class UpdateNotificationPreferenceUseCase {
  constructor(
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {}

  async execute(
    userId: string,
    input: { inAppEnabled?: boolean; emailEnabled?: boolean },
  ): Promise<void> {
    const tasks: Promise<void>[] = [];
    if (input.inAppEnabled !== undefined) {
      tasks.push(this.preferenceRepository.setInAppEnabled(userId, input.inAppEnabled));
    }
    if (input.emailEnabled !== undefined) {
      tasks.push(this.preferenceRepository.setEmailEnabled(userId, input.emailEnabled));
    }
    await Promise.all(tasks);
  }
}
