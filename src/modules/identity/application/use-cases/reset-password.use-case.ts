import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
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
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { HASHER_SERVICE, IHasherService } from '../ports/hasher.port';
import { AuditLogService } from '../../../../common/audit/audit-log.service';
import { buildAuthEmailHtml } from '../services/auth-email.template';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(VERIFICATION_TOKEN_REPOSITORY)
    private readonly tokenRepository: IVerificationTokenRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(HASHER_SERVICE) private readonly hasherService: IHasherService,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly auditLogService: AuditLogService,
    private readonly configService: AppConfigService,
  ) {}

  async execute(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const token = await this.tokenRepository.findValidByHash(tokenHash, 'PASSWORD_RESET');
    if (!token) {
      throw new BadRequestException('Sıfırlama bağlantısının süresi dolmuş veya geçersiz.');
    }

    const user = await this.userRepository.findById(token.userId);
    if (!user || user.isDeleted) {
      throw new BadRequestException('Sıfırlama bağlantısının süresi dolmuş veya geçersiz.');
    }

    const newPasswordHash = await this.hasherService.hash(newPassword);
    user.changePassword(newPasswordHash);
    await this.userRepository.save(user);

    await this.tokenRepository.markUsed(token.id);
    // Şifre değişince tüm cihazlardaki oturumlar sonlandırılır — token'ı ele geçiren
    // biri varsa da bu şekilde erişimi kesilmiş olur.
    await this.refreshTokenRepository.revokeAllForUser(user.id);

    await this.auditLogService.record({
      actorUserId: user.id,
      action: 'PASSWORD_RESET',
      entityType: 'USER',
      entityId: user.id,
    });

    await this.emailSender.send({
      to: user.email.value,
      subject: 'Şifreniz sıfırlandı',
      html: buildAuthEmailHtml({
        recipientName: user.fullName,
        title: 'Şifreniz sıfırlandı',
        message:
          'Hesabınızın şifresi az önce "şifremi unuttum" akışıyla sıfırlandı ve tüm cihazlardaki oturumlarınız sonlandırıldı. Bu işlemi siz yapmadıysanız lütfen hemen bizimle iletişime geçin.',
        ctaLabel: 'Giriş Yap',
        ctaUrl: `${this.configService.frontendUrl}/login`,
      }),
    });
  }
}
