import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import {
  IVerificationTokenRepository,
  StoredVerificationToken,
  VerificationTokenPurpose,
} from '../../domain/repositories/verification-token.repository.interface';

@Injectable()
export class PrismaVerificationTokenRepository implements IVerificationTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    id: string;
    userId: string;
    tokenHash: string;
    purpose: VerificationTokenPurpose;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.verificationToken.create({
      data: {
        id: params.id,
        userId: params.userId,
        tokenHash: params.tokenHash,
        purpose: params.purpose,
        expiresAt: params.expiresAt,
      },
    });
  }

  async findValidByHash(
    tokenHash: string,
    purpose: VerificationTokenPurpose,
  ): Promise<StoredVerificationToken | null> {
    const record = await this.prisma.verificationToken.findFirst({
      where: { tokenHash, purpose, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!record) return null;
    return {
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      purpose: record.purpose as VerificationTokenPurpose,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt,
      createdAt: record.createdAt,
    };
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.verificationToken.update({ where: { id }, data: { usedAt: new Date() } });
  }

  async invalidateAllForUser(userId: string, purpose: VerificationTokenPurpose): Promise<void> {
    await this.prisma.verificationToken.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
