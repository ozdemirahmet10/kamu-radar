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
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { HASHER_SERVICE, IHasherService } from '../ports/hasher.port';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(VERIFICATION_TOKEN_REPOSITORY)
    private readonly tokenRepository: IVerificationTokenRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(HASHER_SERVICE) private readonly hasherService: IHasherService,
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
  }
}
