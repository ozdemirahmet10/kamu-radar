import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { FavoriteRecord, IFavoriteRepository } from '../domain/repositories/favorite.repository.interface';

@Injectable()
export class PrismaFavoriteRepository implements IFavoriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, jobPostingId: string): Promise<void> {
    await this.prisma.jobPostingFavorite.upsert({
      where: { userId_jobPostingId: { userId, jobPostingId } },
      create: { userId, jobPostingId },
      update: {},
    });
  }

  async remove(userId: string, jobPostingId: string): Promise<void> {
    await this.prisma.jobPostingFavorite.deleteMany({ where: { userId, jobPostingId } });
  }

  async listJobPostingIdsByUser(userId: string): Promise<string[]> {
    const favorites = await this.prisma.jobPostingFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { jobPostingId: true },
    });
    return favorites.map((f) => f.jobPostingId);
  }

  async listByUser(userId: string): Promise<FavoriteRecord[]> {
    const favorites = await this.prisma.jobPostingFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { jobPostingId: true, createdAt: true },
    });
    return favorites;
  }
}
