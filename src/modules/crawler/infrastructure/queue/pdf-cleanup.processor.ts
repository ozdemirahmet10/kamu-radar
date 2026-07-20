import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { CleanupExpiredPdfsUseCase } from '../../application/use-cases/cleanup-expired-pdfs.use-case';
import { PDF_CLEANUP_QUEUE_NAME } from './pdf-cleanup-queue.constants';

@Processor(PDF_CLEANUP_QUEUE_NAME)
export class PdfCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfCleanupProcessor.name);

  constructor(private readonly cleanupExpiredPdfsUseCase: CleanupExpiredPdfsUseCase) {
    super();
  }

  async process(): Promise<void> {
    this.logger.log('Süresi geçen ilan PDF\'lerini temizleme işi başlıyor.');
    const deletedCount = await this.cleanupExpiredPdfsUseCase.execute();
    this.logger.log(`PDF temizleme işi tamamlandı: ${deletedCount} PDF silindi.`);
  }
}
