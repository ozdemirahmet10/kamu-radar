import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '@app/config';
import { EMAIL_SENDER, IEmailSender } from '@app/email';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { HASHER_SERVICE, IHasherService } from '../ports/hasher.port';
import { AuditLogService } from '../../../../common/audit/audit-log.service';
import { buildAuthEmailHtml } from '../services/auth-email.template';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(HASHER_SERVICE) private readonly hasherService: IHasherService,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly auditLogService: AuditLogService,
    private readonly configService: AppConfigService,
  ) {}

  async execute(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const isCurrentPasswordValid = await this.hasherService.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mevcut şifreniz yanlış.');
    }

    const newPasswordHash = await this.hasherService.hash(newPassword);
    user.changePassword(newPasswordHash);
    await this.userRepository.save(user);

    await this.auditLogService.record({
      actorUserId: userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: userId,
    });

    await this.emailSender.send({
      to: user.email.value,
      subject: 'Şifreniz değiştirildi',
      html: buildAuthEmailHtml({
        recipientName: user.fullName,
        title: 'Şifreniz değiştirildi',
        message:
          'Hesabınızın şifresi az önce değiştirildi. Bu işlemi siz yapmadıysanız lütfen hemen şifrenizi sıfırlayın ve bizimle iletişime geçin.',
        ctaLabel: 'Ayarlara Git',
        ctaUrl: `${this.configService.frontendUrl}/dashboard/ayarlar`,
      }),
    });
  }
}
