import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppConfigService } from '@app/config';

@ApiTags('push')
@Controller('push')
export class PushConfigController {
  constructor(private readonly configService: AppConfigService) {}

  /** Tarayıcının pushManager.subscribe() çağrısı için gereken genel VAPID anahtarı — gizli değildir. */
  @Get('vapid-public-key')
  getPublicKey(): { publicKey: string } {
    return { publicKey: this.configService.webPush.publicKey };
  }
}
