import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { HASHER_SERVICE, IHasherService } from '../ports/hasher.port';
import { ITokenService, TOKEN_SERVICE, TokenPair } from '../ports/token.port';
import { LoginDto } from '../dto/login.dto';
import { REFRESH_TOKEN_TTL_MS } from '../constants';
import { AuditLogService } from '../../../../common/audit/audit-log.service';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(HASHER_SERVICE) private readonly hasherService: IHasherService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(dto: LoginDto, deviceInfo?: string): Promise<TokenPair> {
    const user = await this.userRepository.findByEmail(dto.email.trim().toLowerCase());
    if (!user) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    const passwordMatches = await this.hasherService.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    if (user.isDeleted) {
      throw new ForbiddenException(
        'Hesabınız silinmiştir. Bilgi almak için info@kamu-radar.com adresi ile iletişime geçebilirsiniz.',
      );
    }

    if (user.isSuspended) {
      throw new ForbiddenException(
        'Hesabınız askıya alınmıştır. Bilgi almak için info@kamu-radar.com adresi ile iletişime geçebilirsiniz.',
      );
    }

    const { token: refreshToken, jti } = this.tokenService.generateRefreshToken(user.id);
    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email.value,
      role: user.role,
      sessionId: jti,
    });
    const refreshTokenHash = await this.tokenService.hashRefreshToken(refreshToken);

    await this.refreshTokenRepository.create({
      id: jti,
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      deviceInfo,
    });

    await this.auditLogService.record({
      actorUserId: user.id,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      changes: deviceInfo ? { deviceInfo } : undefined,
    });

    return { accessToken, refreshToken };
  }
}
