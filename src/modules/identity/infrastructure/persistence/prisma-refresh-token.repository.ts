import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import {
  IRefreshTokenRepository,
  StoredRefreshToken,
} from '../../domain/repositories/refresh-token.repository.interface';

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    deviceInfo?: string;
  }): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        id: params.id,
        userId: params.userId,
        tokenHash: params.tokenHash,
        expiresAt: params.expiresAt,
        deviceInfo: params.deviceInfo,
      },
    });
  }

  async findById(id: string): Promise<StoredRefreshToken | null> {
    const record = await this.prisma.refreshToken.findUnique({ where: { id } });
    if (!record) return null;
    return {
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      deviceInfo: record.deviceInfo,
      createdAt: record.createdAt,
    };
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUserExcept(userId: string, exceptSessionId: string): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null, id: { not: exceptSessionId } },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  async listActiveForUser(userId: string, referenceDate: Date): Promise<StoredRefreshToken[]> {
    const records = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: referenceDate } },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      deviceInfo: record.deviceInfo,
      createdAt: record.createdAt,
    }));
  }
}
