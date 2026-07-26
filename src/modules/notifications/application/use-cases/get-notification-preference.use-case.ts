import { Inject, Injectable } from '@nestjs/common';
import {
  DigestFrequency,
  INotificationPreferenceRepository,
  NOTIFICATION_PREFERENCE_REPOSITORY,
} from '../../domain/repositories/notification-preference.repository.interface';

@Injectable()
export class GetNotificationPreferenceUseCase {
  constructor(
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {}

  async execute(
    userId: string,
  ): Promise<{ inAppEnabled: boolean; emailEnabled: boolean; emailDigestFrequency: DigestFrequency }> {
    const [inAppEnabled, emailEnabled, emailDigestFrequency] = await Promise.all([
      this.preferenceRepository.isInAppEnabled(userId),
      this.preferenceRepository.isEmailEnabled(userId),
      this.preferenceRepository.getEmailDigestFrequency(userId),
    ]);
    return { inAppEnabled, emailEnabled, emailDigestFrequency };
  }
}
