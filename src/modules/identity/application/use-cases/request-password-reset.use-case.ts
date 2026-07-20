import { Inject, Injectable } from '@nestjs/common';
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

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 saat

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(VERIFICATION_TOKEN_REPOSITORY)
    private readonly tokenRepository: IVerificationTokenRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly configService: AppConfigService,
  ) {}

  /**
   * Kullanıcı e-postayla sistemde kayıtlı olsun ya da olmasın aynı şekilde davranır
   * (yanıt her zaman başarılı görünür) — böylece bu uç nokta, hangi e-postaların
   * kayıtlı olduğunu dışarıya sızdıran bir "enumeration" aracına dönüşmez.
   */
  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email.trim().toLowerCase());
    if (!user || user.isDeleted) {
      return;
    }

    await this.tokenRepository.invalidateAllForUser(user.id, 'PASSWORD_RESET');

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await this.tokenRepository.create({
      id: randomUUID(),
      userId: user.id,
      tokenHash,
      purpose: 'PASSWORD_RESET',
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const resetUrl = `${this.configService.frontendUrl}/reset-password?token=${rawToken}`;
    await this.emailSender.send({
      to: user.email.value,
      subject: 'Şifre sıfırlama isteği',
      html: buildAuthEmailHtml({
        recipientName: user.fullName,
        title: 'Şifrenizi sıfırlayın',
        message:
          'Hesabınız için bir şifre sıfırlama isteği aldık. Aşağıdaki butona tıklayarak yeni bir şifre belirleyebilirsiniz. Bu bağlantı 1 saat boyunca geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.',
        ctaLabel: 'Şifremi Sıfırla',
        ctaUrl: resetUrl,
      }),
    });
  }
}
