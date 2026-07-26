import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '@app/config';
import { EMAIL_SENDER, IEmailSender } from '@app/email';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../identity/domain/repositories/user.repository.interface';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../../domain/repositories/notification.repository.interface';
import {
  INotificationPreferenceRepository,
  NOTIFICATION_PREFERENCE_REPOSITORY,
} from '../../domain/repositories/notification-preference.repository.interface';
import { buildDailyDigestEmailHtml } from '../services/notification-email.template';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * EMAIL tercihi "Günlük Özet" olan kullanıcılar için — SyncNotificationsUseCase anlık
 * e-posta göndermeyi atlar (bkz. shouldSendInstantEmail), bu use-case günde bir kez
 * çalışıp son 24 saatte biriken bildirimleri tek bir özet e-postasında toplar.
 */
@Injectable()
export class DailyEmailDigestUseCase {
  private readonly logger = new Logger(DailyEmailDigestUseCase.name);

  constructor(
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferenceRepository: INotificationPreferenceRepository,
    @Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepository: INotificationRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly configService: AppConfigService,
  ) {}

  async execute(): Promise<{ emailsSent: number }> {
    const userIds = await this.preferenceRepository.findUserIdsForDailyEmailDigest();
    const since = new Date(Date.now() - DAY_MS);
    let emailsSent = 0;

    for (const userId of userIds) {
      try {
        const notifications = await this.notificationRepository.findCreatedSince(userId, since);
        if (notifications.length === 0) continue;

        const user = await this.userRepository.findById(userId);
        if (!user) continue;

        await this.emailSender.send({
          to: user.email.value,
          subject: `Kamu Radar Günlük Özet — ${notifications.length} yeni bildirim`,
          html: buildDailyDigestEmailHtml({
            recipientName: user.fullName,
            items: notifications.map((n) => ({
              title: n.title,
              message: n.message,
              ctaUrl: n.jobPostingId
                ? `${this.configService.frontendUrl}/dashboard/ilanlar/${n.jobPostingId}`
                : `${this.configService.frontendUrl}/dashboard/bildirimler`,
            })),
            dashboardUrl: `${this.configService.frontendUrl}/dashboard/bildirimler`,
          }),
        });
        emailsSent += 1;
      } catch (error) {
        this.logger.warn(`Günlük özet e-postası başarısız oldu (${userId}): ${(error as Error).message}`);
      }
    }

    return { emailsSent };
  }
}
