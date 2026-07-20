import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { INotificationPreferenceRepository } from '../domain/repositories/notification-preference.repository.interface';

@Injectable()
export class PrismaNotificationPreferenceRepository implements INotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isInAppEnabled(userId: string): Promise<boolean> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: { userId_channel: { userId, channel: 'IN_APP' } },
    });
    return preference?.isEnabled ?? true;
  }

  async setInAppEnabled(userId: string, isEnabled: boolean): Promise<void> {
    await this.prisma.notificationPreference.upsert({
      where: { userId_channel: { userId, channel: 'IN_APP' } },
      create: { userId, channel: 'IN_APP', isEnabled },
      update: { isEnabled },
    });
  }

  async isEmailEnabled(userId: string): Promise<boolean> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: { userId_channel: { userId, channel: 'EMAIL' } },
    });
    return preference?.isEnabled ?? true;
  }

  async setEmailEnabled(userId: string, isEnabled: boolean): Promise<void> {
    await this.prisma.notificationPreference.upsert({
      where: { userId_channel: { userId, channel: 'EMAIL' } },
      create: { userId, channel: 'EMAIL', isEnabled },
      update: { isEnabled },
    });
  }
}
