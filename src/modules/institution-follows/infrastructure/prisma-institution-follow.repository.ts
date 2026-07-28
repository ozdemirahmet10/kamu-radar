import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import {
  IInstitutionFollowRepository,
  InstitutionFollowRecord,
} from '../domain/repositories/institution-follow.repository.interface';

@Injectable()
export class PrismaInstitutionFollowRepository implements IInstitutionFollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async follow(userId: string, institutionName: string): Promise<void> {
    await this.prisma.institutionFollow.upsert({
      where: { userId_institutionName: { userId, institutionName } },
      create: { userId, institutionName },
      update: {},
    });
  }

  async unfollow(userId: string, institutionName: string): Promise<void> {
    await this.prisma.institutionFollow.deleteMany({ where: { userId, institutionName } });
  }

  async listByUser(userId: string): Promise<InstitutionFollowRecord[]> {
    return this.prisma.institutionFollow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { institutionName: true, createdAt: true },
    });
  }

  async listInstitutionNamesByUser(userId: string): Promise<string[]> {
    const follows = await this.prisma.institutionFollow.findMany({
      where: { userId },
      select: { institutionName: true },
    });
    return follows.map((follow) => follow.institutionName);
  }
}
