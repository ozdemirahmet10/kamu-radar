export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface StoredRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  deviceInfo: string | null;
  createdAt: Date;
}

export interface IRefreshTokenRepository {
  create(params: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    deviceInfo?: string;
  }): Promise<void>;
  findById(id: string): Promise<StoredRefreshToken | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  /** Kullanıcının hâlâ geçerli (iptal edilmemiş, süresi geçmemiş) oturumları — "Oturumlar" ayarı için. */
  listActiveForUser(userId: string, referenceDate: Date): Promise<StoredRefreshToken[]>;
}
