export const VERIFICATION_TOKEN_REPOSITORY = Symbol('VERIFICATION_TOKEN_REPOSITORY');

export type VerificationTokenPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export interface StoredVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  purpose: VerificationTokenPurpose;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface IVerificationTokenRepository {
  create(params: {
    id: string;
    userId: string;
    tokenHash: string;
    purpose: VerificationTokenPurpose;
    expiresAt: Date;
  }): Promise<void>;
  /** Süresi geçmemiş ve kullanılmamış eşleşen kaydı hash üzerinden bulur. */
  findValidByHash(
    tokenHash: string,
    purpose: VerificationTokenPurpose,
  ): Promise<StoredVerificationToken | null>;
  markUsed(id: string): Promise<void>;
  /** Aynı amaç için daha önce gönderilmiş, henüz kullanılmamış tokenları geçersizleştirir. */
  invalidateAllForUser(userId: string, purpose: VerificationTokenPurpose): Promise<void>;
}
