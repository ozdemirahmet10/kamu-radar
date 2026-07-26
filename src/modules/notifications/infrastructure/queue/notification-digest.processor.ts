import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { DailyEmailDigestUseCase } from '../../application/use-cases/daily-email-digest.use-case';
import { NOTIFICATION_DIGEST_QUEUE_NAME } from './notification-digest-queue.constants';

@Processor(NOTIFICATION_DIGEST_QUEUE_NAME)
export class NotificationDigestProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationDigestProcessor.name);

  constructor(private readonly dailyEmailDigestUseCase: DailyEmailDigestUseCase) {
    super();
  }

  async process(): Promise<void> {
    this.logger.log('Günlük e-posta özeti işi başlıyor.');
    const { emailsSent } = await this.dailyEmailDigestUseCase.execute();
    this.logger.log(`Günlük e-posta özeti tamamlandı: ${emailsSent} e-posta gönderildi.`);
  }
}
