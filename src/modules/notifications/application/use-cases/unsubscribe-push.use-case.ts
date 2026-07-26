import { Inject, Injectable } from '@nestjs/common';
import {
  IPushSubscriptionRepository,
  PUSH_SUBSCRIPTION_REPOSITORY,
} from '../../domain/repositories/push-subscription.repository.interface';

@Injectable()
export class UnsubscribePushUseCase {
  constructor(
    @Inject(PUSH_SUBSCRIPTION_REPOSITORY)
    private readonly pushSubscriptionRepository: IPushSubscriptionRepository,
  ) {}

  async execute(userId: string, endpoint: string): Promise<void> {
    // Sahiplik kontrolü — endpoint tahmin edilemez uzunlukta olsa da, bir kullanıcının
    // başka birinin aboneliğini silememesi için sadece kendi kayıtları arasında arar.
    const subscriptions = await this.pushSubscriptionRepository.findByUserId(userId);
    if (!subscriptions.some((s) => s.endpoint === endpoint)) {
      return;
    }
    await this.pushSubscriptionRepository.deleteByEndpoint(endpoint);
  }
}
