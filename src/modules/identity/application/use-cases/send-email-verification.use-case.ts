import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, randomUUID, createHash } from 'crypto';
import { AppConfigService } from '@app/config';
import { EMAIL_SENDER, IEmailSender } from '@app/email';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IVerificationTokenRepository,
  VERIFICATION_TOKEN_REPOSITORY,
} from '../../domain/repositories/verification-token.repository.interface';
import { buildAuthEmailHtml } from '../services/auth-email.template';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat

@Injectable()
export class SendEmailVerificationUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(VERIFICATION_TOKEN_REPOSITORY)
    private readonly tokenRepository: IVerificationTokenRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly configService: AppConfigService,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
    if (user.isEmailVerified) {
      return;
    }

    await this.tokenRepository.invalidateAllForUser(user.id, 'EMAIL_VERIFICATION');

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await this.tokenRepository.create({
      id: randomUUID(),
      userId: user.id,
      tokenHash,
      purpose: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    });

    const verifyUrl = `${this.configService.frontendUrl}/verify-email?token=${rawToken}`;
    await this.emailSender.send({
      to: user.email.value,
      subject: 'E-posta adresinizi doğrulayın',
      html: buildAuthEmailHtml({
        recipientName: user.fullName,
        title: 'E-posta adresinizi doğrulayın',
        message:
          'Kamu Radar hesabınızı tam olarak kullanabilmeniz için e-posta adresinizi doğrulamanız gerekiyor. Aşağıdaki butona tıklayarak doğrulayabilirsiniz. Bu bağlantı 24 saat boyunca geçerlidir.',
        ctaLabel: 'E-postamı Doğrula',
        ctaUrl: verifyUrl,
      }),
    });
  }
}
