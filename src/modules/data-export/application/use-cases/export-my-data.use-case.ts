import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogService, AuditLogRecord } from '../../../../common/audit/audit-log.service';
import { USER_REPOSITORY } from '../../../identity/domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../../identity/domain/repositories/user.repository.interface';
import { USER_PROFILE_REPOSITORY } from '../../../identity/domain/repositories/user-profile.repository.interface';
import type { IUserProfileRepository } from '../../../identity/domain/repositories/user-profile.repository.interface';
import { MATCH_RESULT_REPOSITORY } from '../../../matching/domain/repositories/match-result.repository.interface';
import type {
  IMatchResultRepository,
  MatchResultRecord,
} from '../../../matching/domain/repositories/match-result.repository.interface';
import { FAVORITE_REPOSITORY } from '../../../favorites/domain/repositories/favorite.repository.interface';
import type {
  IFavoriteRepository,
  FavoriteRecord,
} from '../../../favorites/domain/repositories/favorite.repository.interface';
import { APPLICATION_REPOSITORY } from '../../../applications/domain/repositories/application.repository.interface';
import type {
  IApplicationRepository,
  ApplicationRecord,
} from '../../../applications/domain/repositories/application.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../../notifications/domain/repositories/notification.repository.interface';
import type {
  INotificationRepository,
  NotificationRecord,
} from '../../../notifications/domain/repositories/notification.repository.interface';
import { NOTIFICATION_PREFERENCE_REPOSITORY } from '../../../notifications/domain/repositories/notification-preference.repository.interface';
import type { INotificationPreferenceRepository } from '../../../notifications/domain/repositories/notification-preference.repository.interface';
import { PUSH_SUBSCRIPTION_REPOSITORY } from '../../../notifications/domain/repositories/push-subscription.repository.interface';
import type { IPushSubscriptionRepository } from '../../../notifications/domain/repositories/push-subscription.repository.interface';
import type { UserProfileProps } from '../../../identity/domain/entities/user-profile.entity';

const UNPAGINATED_PAGE_SIZE = 100_000;

export interface UserDataExport {
  exportedAt: string;
  account: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    isEmailVerified: boolean;
    createdAt: Date;
  };
  profile: UserProfileProps | null;
  notificationPreferences: {
    inAppEnabled: boolean;
    emailEnabled: boolean;
    emailDigestFrequency: string;
  };
  pushSubscriptionEndpoints: string[];
  matches: MatchResultRecord[];
  favorites: FavoriteRecord[];
  applications: ApplicationRecord[];
  notifications: NotificationRecord[];
  securityHistory: AuditLogRecord[];
}

@Injectable()
export class ExportMyDataUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(USER_PROFILE_REPOSITORY) private readonly userProfileRepository: IUserProfileRepository,
    @Inject(MATCH_RESULT_REPOSITORY) private readonly matchResultRepository: IMatchResultRepository,
    @Inject(FAVORITE_REPOSITORY) private readonly favoriteRepository: IFavoriteRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
    @Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepository: INotificationRepository,
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly notificationPreferenceRepository: INotificationPreferenceRepository,
    @Inject(PUSH_SUBSCRIPTION_REPOSITORY)
    private readonly pushSubscriptionRepository: IPushSubscriptionRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(userId: string): Promise<UserDataExport> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const [
      profile,
      inAppEnabled,
      emailEnabled,
      emailDigestFrequency,
      pushSubscriptions,
      matches,
      favorites,
      applications,
      notificationsResult,
      securityHistoryResult,
    ] = await Promise.all([
      this.userProfileRepository.findByUserId(userId),
      this.notificationPreferenceRepository.isInAppEnabled(userId),
      this.notificationPreferenceRepository.isEmailEnabled(userId),
      this.notificationPreferenceRepository.getEmailDigestFrequency(userId),
      this.pushSubscriptionRepository.findByUserId(userId),
      this.matchResultRepository.findByUserId(userId),
      this.favoriteRepository.listByUser(userId),
      this.applicationRepository.listByUser(userId),
      this.notificationRepository.list(userId, 1, UNPAGINATED_PAGE_SIZE),
      this.auditLogService.listForUser(userId, 1, UNPAGINATED_PAGE_SIZE),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email.value,
        fullName: user.fullName,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      profile: profile ? profile.snapshot : null,
      notificationPreferences: {
        inAppEnabled,
        emailEnabled,
        emailDigestFrequency,
      },
      pushSubscriptionEndpoints: pushSubscriptions.map((subscription) => subscription.endpoint),
      matches,
      favorites,
      applications,
      notifications: notificationsResult.items,
      securityHistory: securityHistoryResult.items,
    };
  }
}
