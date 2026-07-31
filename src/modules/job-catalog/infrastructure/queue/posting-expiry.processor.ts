import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ExpireOverduePostingsUseCase } from '../../application/use-cases/expire-overdue-postings.use-case';
import { POSTING_EXPIRY_QUEUE_NAME } from './posting-expiry-queue.constants';

@Processor(POSTING_EXPIRY_QUEUE_NAME)
export class PostingExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(PostingExpiryProcessor.name);

  constructor(private readonly expireOverduePostingsUseCase: ExpireOverduePostingsUseCase) {
    super();
  }

  async process(): Promise<void> {
    this.logger.log('Süresi geçen ilanları EXPIRED durumuna alma işi başlıyor.');
    const count = await this.expireOverduePostingsUseCase.execute();
    this.logger.log(`İlan durumu güncelleme işi tamamlandı: ${count} ilan EXPIRED yapıldı.`);
  }
}
