import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import {
  DigestFrequency,
  INotificationPreferenceRepository,
} from '../domain/repositories/notification-preference.repository.interface';

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

  async getEmailDigestFrequency(userId: string): Promise<DigestFrequency> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: { userId_channel: { userId, channel: 'EMAIL' } },
    });
    return (preference?.digestFrequency as DigestFrequency) ?? 'INSTANT';
  }

  async setEmailDigestFrequency(userId: string, frequency: DigestFrequency): Promise<void> {
    await this.prisma.notificationPreference.upsert({
      where: { userId_channel: { userId, channel: 'EMAIL' } },
      create: { userId, channel: 'EMAIL', digestFrequency: frequency },
      update: { digestFrequency: frequency },
    });
  }

  async findUserIdsForDailyEmailDigest(): Promise<string[]> {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: { channel: 'EMAIL', isEnabled: true, digestFrequency: 'DAILY' },
      select: { userId: true },
    });
    return preferences.map((p) => p.userId);
  }
}
