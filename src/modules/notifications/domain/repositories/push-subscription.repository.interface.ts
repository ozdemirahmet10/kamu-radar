export const PUSH_SUBSCRIPTION_REPOSITORY = Symbol('PUSH_SUBSCRIPTION_REPOSITORY');

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface IPushSubscriptionRepository {
  upsert(params: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }): Promise<void>;
  findByUserId(userId: string): Promise<PushSubscriptionRecord[]>;
  deleteByEndpoint(endpoint: string): Promise<void>;
}
