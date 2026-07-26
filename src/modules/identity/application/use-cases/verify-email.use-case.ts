import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IVerificationTokenRepository,
  VERIFICATION_TOKEN_REPOSITORY,
} from '../../domain/repositories/verification-token.repository.interface';
import { AuditLogService } from '../../../../common/audit/audit-log.service';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(VERIFICATION_TOKEN_REPOSITORY)
    private readonly tokenRepository: IVerificationTokenRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(rawToken: string): Promise<void> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const token = await this.tokenRepository.findValidByHash(tokenHash, 'EMAIL_VERIFICATION');
    if (!token) {
      throw new BadRequestException('Doğrulama bağlantısının süresi dolmuş veya geçersiz.');
    }

    const user = await this.userRepository.findById(token.userId);
    if (!user) {
      throw new BadRequestException('Doğrulama bağlantısının süresi dolmuş veya geçersiz.');
    }

    user.verifyEmail();
    await this.userRepository.save(user);
    await this.tokenRepository.markUsed(token.id);

    await this.auditLogService.record({
      actorUserId: user.id,
      action: 'EMAIL_VERIFIED',
      entityType: 'USER',
      entityId: user.id,
    });
  }
}
