import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { ITokenService, TOKEN_SERVICE, TokenPair } from '../ports/token.port';
import { REFRESH_TOKEN_TTL_MS } from '../constants';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async execute(rawRefreshToken: string): Promise<TokenPair> {
    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedException('Geçersiz yenileme jetonu');
    }

    const stored = await this.refreshTokenRepository.findById(payload.jti);
    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      stored.userId !== payload.sub
    ) {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş yenileme jetonu');
    }

    const matches = await this.tokenService.compareRefreshToken(rawRefreshToken, stored.tokenHash);
    if (!matches) {
      throw new UnauthorizedException('Geçersiz yenileme jetonu');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    // Rotasyon: kullanılan refresh token invalidate edilir, yenisi üretilir.
    await this.refreshTokenRepository.revoke(stored.id);

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email.value,
      role: user.role,
    });
    const { token: newRefreshToken, jti } = this.tokenService.generateRefreshToken(user.id);
    const newRefreshTokenHash = await this.tokenService.hashRefreshToken(newRefreshToken);

    await this.refreshTokenRepository.create({
      id: jti,
      userId: user.id,
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}
