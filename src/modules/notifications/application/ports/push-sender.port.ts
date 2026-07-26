export const PUSH_SENDER = Symbol('PUSH_SENDER');

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface SendPushParams {
  subscription: PushSubscriptionKeys;
  title: string;
  body: string;
  url: string;
}

export interface IPushSender {
  /**
   * Gönderim başarısız olursa (örn. abonelik artık geçersiz — tarayıcı 410/404 döner)
   * `false` döner; bu durumda çağıran taraf ilgili aboneliği veritabanından silmelidir.
   */
  send(params: SendPushParams): Promise<{ delivered: boolean; shouldRemoveSubscription: boolean }>;
}
