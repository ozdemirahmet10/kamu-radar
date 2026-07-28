import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '@app/config';
import {
  GetMyMatchesUseCase,
  MatchedJobPosting,
} from '../../../matching/application/use-cases/get-my-matches.use-case';
import { EligibilityStatus } from '../../../matching/domain/entities/eligibility-result';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../identity/domain/repositories/user.repository.interface';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
  NotificationCandidate,
} from '../../domain/repositories/notification.repository.interface';
import {
  INotificationPreferenceRepository,
  NOTIFICATION_PREFERENCE_REPOSITORY,
} from '../../domain/repositories/notification-preference.repository.interface';
import {
  IPushSubscriptionRepository,
  PUSH_SUBSCRIPTION_REPOSITORY,
} from '../../domain/repositories/push-subscription.repository.interface';
import { EMAIL_SENDER, IEmailSender } from '@app/email';
import { PUSH_SENDER, IPushSender } from '../ports/push-sender.port';
import { buildNotificationEmailHtml } from '../services/notification-email.template';
import {
  IInstitutionFollowRepository,
  INSTITUTION_FOLLOW_REPOSITORY,
} from '../../../institution-follows/domain/repositories/institution-follow.repository.interface';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../../job-catalog/domain/repositories/job-posting.repository.interface';

const DAY_MS = 24 * 60 * 60 * 1000;
const NEW_THRESHOLD_DAYS = 3;
const DEADLINE_SOON_THRESHOLD_DAYS = 3;
const MAX_MATCHES_SCANNED = 200;

function isNewMatch(match: MatchedJobPosting, now: number): boolean {
  const createdAt = match.jobPosting.snapshot.createdAt.getTime();
  return now - createdAt < NEW_THRESHOLD_DAYS * DAY_MS;
}

function isDeadlineSoon(match: MatchedJobPosting, now: number): boolean {
  const endDate = match.jobPosting.snapshot.applicationWindow.endDate;
  if (!endDate) return false;
  const daysLeft = (endDate.getTime() - now) / DAY_MS;
  return daysLeft >= 0 && daysLeft <= DEADLINE_SOON_THRESHOLD_DAYS;
}

@Injectable()
export class SyncNotificationsUseCase {
  private readonly logger = new Logger(SyncNotificationsUseCase.name);

  constructor(
    private readonly getMyMatchesUseCase: GetMyMatchesUseCase,
    @Inject(NOTIFICATION_REPOSITORY) private readonly notificationRepository: INotificationRepository,
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferenceRepository: INotificationPreferenceRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    @Inject(PUSH_SUBSCRIPTION_REPOSITORY)
    private readonly pushSubscriptionRepository: IPushSubscriptionRepository,
    @Inject(PUSH_SENDER) private readonly pushSender: IPushSender,
    @Inject(INSTITUTION_FOLLOW_REPOSITORY)
    private readonly institutionFollowRepository: IInstitutionFollowRepository,
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
    private readonly configService: AppConfigService,
  ) {}

  async execute(userId: string): Promise<void> {
    // IN_APP tercihi burada bir "ana anahtar" gibi davranır — kapalıysa hiçbir yeni
    // bildirim (e-posta dahil) üretilmez. EMAIL tercihi ise IN_APP açıkken devreye
    // giren ek bir kanaldır (bkz. isEmailEnabled kullanımı aşağıda).
    const isEnabled = await this.preferenceRepository.isInAppEnabled(userId);
    if (!isEnabled) {
      return;
    }
    const emailEnabled = await this.preferenceRepository.isEmailEnabled(userId);
    // Günlük özet seçilmişse anlık e-posta gönderilmez — bildirim yine de burada
    // oluşturulur (in-app listesinde görünsün diye), gönderimi DailyEmailDigestUseCase
    // üstlenir (bkz. notification-digest-queue).
    const emailDigestFrequency = emailEnabled
      ? await this.preferenceRepository.getEmailDigestFrequency(userId)
      : 'INSTANT';
    const shouldSendInstantEmail = emailEnabled && emailDigestFrequency === 'INSTANT';

    const result = await this.getMyMatchesUseCase.execute({
      userId,
      statuses: [EligibilityStatus.ELIGIBLE, EligibilityStatus.PARTIALLY_ELIGIBLE],
      page: 1,
      pageSize: MAX_MATCHES_SCANNED,
    });

    const user = shouldSendInstantEmail ? await this.userRepository.findById(userId) : null;
    // Web Push'ta ayrı bir "açık/kapalı" tercihi yok — kullanıcının aboneliğinin var
    // olması zaten opt-in'dir (tarayıcı izni verip abone olmadan kayıt oluşmaz).
    const pushSubscriptions = await this.pushSubscriptionRepository.findByUserId(userId);
    const now = Date.now();
    const tasks: Promise<void>[] = [];

    const sendPushToAllSubscriptions = async (title: string, body: string, jobPostingId: string) => {
      const url = `${this.configService.frontendUrl}/dashboard/ilanlar/${jobPostingId}`;
      await Promise.all(
        pushSubscriptions.map(async (subscription) => {
          const { shouldRemoveSubscription } = await this.pushSender.send({
            subscription,
            title,
            body,
            url,
          });
          if (shouldRemoveSubscription) {
            await this.pushSubscriptionRepository.deleteByEndpoint(subscription.endpoint);
          }
        }),
      );
    };

    const handleCandidate = (candidate: NotificationCandidate, jobPostingId: string) => {
      tasks.push(
        this.notificationRepository.upsertIfNotExists(candidate).then(async ({ wasCreated }) => {
          if (!wasCreated) return;
          if (pushSubscriptions.length > 0) {
            await sendPushToAllSubscriptions(candidate.title, candidate.message, jobPostingId);
          }
          if (!shouldSendInstantEmail || !user) return;
          await this.emailSender.send({
            to: user.email.value,
            subject: candidate.title,
            html: buildNotificationEmailHtml({
              recipientName: user.fullName,
              title: candidate.title,
              message: candidate.message,
              ctaUrl: `${this.configService.frontendUrl}/dashboard/ilanlar/${jobPostingId}`,
            }),
          });
        }),
      );
    };

    for (const match of result.items) {
      const { institutionName, positionTitle } = match.jobPosting.snapshot;

      if (isNewMatch(match, now)) {
        handleCandidate(
          {
            userId,
            jobPostingId: match.jobPosting.id,
            type: 'NEW_MATCH',
            title: 'Yeni uygun ilan bulundu',
            message: `${institutionName} - ${positionTitle}`,
          },
          match.jobPosting.id,
        );
      }

      if (isDeadlineSoon(match, now)) {
        handleCandidate(
          {
            userId,
            jobPostingId: match.jobPosting.id,
            type: 'DEADLINE_SOON',
            title: 'Son başvuru tarihi yaklaşıyor',
            message: `${institutionName} - ${positionTitle} için son başvuru tarihi yaklaşıyor`,
          },
          match.jobPosting.id,
        );
      }
    }

    const followedInstitutions = await this.institutionFollowRepository.listInstitutionNamesByUser(
      userId,
    );
    if (followedInstitutions.length > 0) {
      const since = new Date(now - NEW_THRESHOLD_DAYS * DAY_MS);
      const recentPostings = await this.jobPostingRepository.findRecentByInstitutionNames(
        followedInstitutions,
        since,
      );
      for (const posting of recentPostings) {
        handleCandidate(
          {
            userId,
            jobPostingId: posting.id,
            type: 'NEW_FROM_FOLLOWED_INSTITUTION',
            title: 'Takip ettiğiniz kurumdan yeni ilan',
            message: `${posting.institutionName} - ${posting.positionTitle}`,
          },
          posting.id,
        );
      }
    }

    const outcomes = await Promise.allSettled(tasks);
    for (const outcome of outcomes) {
      if (outcome.status === 'rejected') {
        this.logger.warn(`Bildirim senkronizasyonu adımı başarısız oldu: ${outcome.reason}`);
      }
    }
  }
}
