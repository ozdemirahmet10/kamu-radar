import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';

@Injectable()
export class RevokeMySessionUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(userId: string, sessionId: string): Promise<void> {
    const session = await this.refreshTokenRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Oturum bulunamadı.');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Bu oturum size ait değil.');
    }
    await this.refreshTokenRepository.revoke(sessionId);
  }
}
