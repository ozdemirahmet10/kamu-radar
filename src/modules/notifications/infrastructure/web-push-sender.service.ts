import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as webpush from 'web-push';
import { AppConfigService } from '@app/config';
import { IPushSender, SendPushParams } from '../application/ports/push-sender.port';

@Injectable()
export class WebPushSender implements IPushSender, OnModuleInit {
  private readonly logger = new Logger(WebPushSender.name);

  constructor(private readonly configService: AppConfigService) {}

  onModuleInit(): void {
    const { publicKey, privateKey, contactEmail } = this.configService.webPush;
    if (!publicKey || !privateKey) {
      this.logger.warn('VAPID anahtarları ayarlanmamış — Web Push bildirimleri gönderilemeyecek.');
      return;
    }
    webpush.setVapidDetails(contactEmail, publicKey, privateKey);
  }

  async send(
    params: SendPushParams,
  ): Promise<{ delivered: boolean; shouldRemoveSubscription: boolean }> {
    try {
      await webpush.sendNotification(
        {
          endpoint: params.subscription.endpoint,
          keys: { p256dh: params.subscription.p256dh, auth: params.subscription.auth },
        },
        JSON.stringify({ title: params.title, body: params.body, url: params.url }),
      );
      return { delivered: true, shouldRemoveSubscription: false };
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      // 404/410: tarayıcı aboneliği geçersiz kılmış (örn. kullanıcı bildirimleri kapattı,
      // ya da tarayıcı verisi silindi) — bu abonelik artık kullanılamaz, silinmeli.
      const shouldRemoveSubscription = statusCode === 404 || statusCode === 410;
      if (!shouldRemoveSubscription) {
        this.logger.warn(`Push bildirimi gönderilemedi: ${(error as Error).message}`);
      }
      return { delivered: false, shouldRemoveSubscription };
    }
  }
}
