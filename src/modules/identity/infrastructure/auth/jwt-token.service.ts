import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AppConfigService } from '@app/config';
import {
  AccessTokenPayload,
  ITokenService,
  RefreshTokenPayload,
} from '../../application/ports/token.port';

const REFRESH_TOKEN_HASH_ROUNDS = 10;

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  generateAccessToken(payload: AccessTokenPayload): string {
    const { accessSecret, accessExpiresIn } = this.configService.jwt;
    return this.jwtService.sign(payload, { secret: accessSecret, expiresIn: accessExpiresIn });
  }

  generateRefreshToken(userId: string): { token: string; jti: string } {
    const { refreshSecret, refreshExpiresIn } = this.configService.jwt;
    const jti = randomUUID();
    const token = this.jwtService.sign(
      { sub: userId, jti },
      { secret: refreshSecret, expiresIn: refreshExpiresIn },
    );
    return { token, jti };
  }

  async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, REFRESH_TOKEN_HASH_ROUNDS);
  }

  async compareRefreshToken(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const { accessSecret } = this.configService.jwt;
    return this.jwtService.verify<AccessTokenPayload>(token, { secret: accessSecret });
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const { refreshSecret } = this.configService.jwt;
    return this.jwtService.verify<RefreshTokenPayload>(token, { secret: refreshSecret });
  }
}
