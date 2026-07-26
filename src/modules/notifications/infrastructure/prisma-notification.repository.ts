import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import {
  INotificationRepository,
  ListNotificationsResult,
  NotificationCandidate,
  NotificationRecord,
} from '../domain/repositories/notification.repository.interface';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertIfNotExists(candidate: NotificationCandidate): Promise<{ wasCreated: boolean }> {
    const key = {
      userId_jobPostingId_type: {
        userId: candidate.userId,
        jobPostingId: candidate.jobPostingId,
        type: candidate.type,
      },
    };
    const existing = await this.prisma.notificationLog.findUnique({ where: key });
    if (existing) {
      return { wasCreated: false };
    }
    try {
      await this.prisma.notificationLog.create({
        data: {
          userId: candidate.userId,
          jobPostingId: candidate.jobPostingId,
          channel: 'IN_APP',
          type: candidate.type,
          title: candidate.title,
          message: candidate.message,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
      return { wasCreated: true };
    } catch {
      // Eşzamanlı iki senkronizasyon aynı anda çakışırsa (unique constraint), kayıt zaten
      // diğer çağrı tarafından oluşturulmuş demektir — bu çağrı için yeni sayılmaz.
      return { wasCreated: false };
    }
  }

  async list(userId: string, page: number, pageSize: number): Promise<ListNotificationsResult> {
    const [records, totalCount, unreadCount] = await this.prisma.$transaction([
      this.prisma.notificationLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notificationLog.count({ where: { userId } }),
      this.prisma.notificationLog.count({ where: { userId, status: { not: 'READ' } } }),
    ]);

    const items: NotificationRecord[] = records.map((record) => ({
      id: record.id,
      jobPostingId: record.jobPostingId,
      type: record.type as NotificationRecord['type'],
      title: record.title,
      message: record.message,
      isRead: record.status === 'READ',
      createdAt: record.createdAt,
    }));

    return {
      items,
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      unreadCount,
    };
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notificationLog.count({ where: { userId, status: { not: 'READ' } } });
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.prisma.notificationLog.updateMany({
      where: { id, userId },
      data: { status: 'READ' },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notificationLog.updateMany({
      where: { userId, status: { not: 'READ' } },
      data: { status: 'READ' },
    });
  }

  async findCreatedSince(userId: string, since: Date): Promise<NotificationRecord[]> {
    const records = await this.prisma.notificationLog.findMany({
      where: { userId, channel: 'IN_APP', createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => ({
      id: record.id,
      jobPostingId: record.jobPostingId,
      type: record.type as NotificationRecord['type'],
      title: record.title,
      message: record.message,
      isRead: record.status === 'READ',
      createdAt: record.createdAt,
    }));
  }
}
