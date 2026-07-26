import { Inject, Injectable } from '@nestjs/common';
import {
  IPushSubscriptionRepository,
  PUSH_SUBSCRIPTION_REPOSITORY,
} from '../../domain/repositories/push-subscription.repository.interface';

@Injectable()
export class SubscribePushUseCase {
  constructor(
    @Inject(PUSH_SUBSCRIPTION_REPOSITORY)
    private readonly pushSubscriptionRepository: IPushSubscriptionRepository,
  ) {}

  async execute(
    userId: string,
    subscription: { endpoint: string; p256dh: string; auth: string },
  ): Promise<void> {
    await this.pushSubscriptionRepository.upsert({ userId, ...subscription });
  }
}
