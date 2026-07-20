import { UserRole } from '../../domain/entities/user.entity';

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface ITokenService {
  generateAccessToken(payload: AccessTokenPayload): string;
  generateRefreshToken(userId: string): { token: string; jti: string };
  hashRefreshToken(token: string): Promise<string>;
  compareRefreshToken(token: string, hash: string): Promise<boolean>;
  verifyAccessToken(token: string): AccessTokenPayload;
  verifyRefreshToken(token: string): RefreshTokenPayload;
}
