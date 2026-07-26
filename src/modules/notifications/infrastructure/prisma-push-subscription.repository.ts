import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '@app/database';
import {
  IPushSubscriptionRepository,
  PushSubscriptionRecord,
} from '../domain/repositories/push-subscription.repository.interface';

@Injectable()
export class PrismaPushSubscriptionRepository implements IPushSubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(params: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: params.endpoint },
      create: {
        id: randomUUID(),
        userId: params.userId,
        endpoint: params.endpoint,
        p256dh: params.p256dh,
        auth: params.auth,
      },
      // Aynı endpoint farklı bir kullanıcı için tekrar abone olursa (örn. paylaşılan
      // cihaz), kaydı yeni kullanıcıya taşır — tarayıcı endpoint'i tekil kabul edilir.
      update: { userId: params.userId, p256dh: params.p256dh, auth: params.auth },
    });
  }

  async findByUserId(userId: string): Promise<PushSubscriptionRecord[]> {
    const records = await this.prisma.pushSubscription.findMany({ where: { userId } });
    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      endpoint: record.endpoint,
      p256dh: record.p256dh,
      auth: record.auth,
    }));
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }
}
