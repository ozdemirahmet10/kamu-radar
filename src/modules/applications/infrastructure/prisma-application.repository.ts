import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import {
  ApplicationRecord,
  IApplicationRepository,
  UpdateApplicationChanges,
} from '../domain/repositories/application.repository.interface';

@Injectable()
export class PrismaApplicationRepository implements IApplicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, jobPostingId: string): Promise<void> {
    await this.prisma.jobApplication.upsert({
      where: { userId_jobPostingId: { userId, jobPostingId } },
      create: { userId, jobPostingId },
      update: {},
    });
  }

  async remove(userId: string, jobPostingId: string): Promise<void> {
    await this.prisma.jobApplication.deleteMany({ where: { userId, jobPostingId } });
  }

  async update(
    userId: string,
    jobPostingId: string,
    changes: UpdateApplicationChanges,
  ): Promise<void> {
    await this.prisma.jobApplication.updateMany({
      where: { userId, jobPostingId },
      data: {
        ...(changes.status !== undefined ? { status: changes.status } : {}),
        ...(changes.note !== undefined ? { note: changes.note } : {}),
        ...(changes.nextActionLabel !== undefined
          ? { nextActionLabel: changes.nextActionLabel }
          : {}),
        ...(changes.nextActionDate !== undefined
          ? { nextActionDate: changes.nextActionDate }
          : {}),
      },
    });
  }

  async listByUser(userId: string): Promise<ApplicationRecord[]> {
    const records = await this.prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => ({
      id: record.id,
      jobPostingId: record.jobPostingId,
      status: record.status as ApplicationRecord['status'],
      note: record.note,
      nextActionLabel: record.nextActionLabel,
      nextActionDate: record.nextActionDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  async listJobPostingIdsByUser(userId: string): Promise<string[]> {
    const records = await this.prisma.jobApplication.findMany({
      where: { userId },
      select: { jobPostingId: true },
    });
    return records.map((record) => record.jobPostingId);
  }
}
