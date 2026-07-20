import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../../job-catalog/domain/repositories/job-posting.repository.interface';
import { RAW_CONTENT_STORE, IRawContentStore } from '../ports/raw-content-store.port';

const PDF_RETENTION_DAYS_AFTER_EXPIRY = 30;

@Injectable()
export class CleanupExpiredPdfsUseCase {
  private readonly logger = new Logger(CleanupExpiredPdfsUseCase.name);

  constructor(
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
    @Inject(RAW_CONTENT_STORE) private readonly rawContentStore: IRawContentStore,
  ) {}

  async execute(): Promise<number> {
    const retentionCutoff = new Date(
      Date.now() - PDF_RETENTION_DAYS_AFTER_EXPIRY * 24 * 60 * 60 * 1000,
    );
    const expired = await this.jobPostingRepository.findExpiredWithPdf(retentionCutoff);

    for (const jobPosting of expired) {
      const key = jobPosting.snapshot.pdfStorageKey;
      if (!key) continue;
      await this.rawContentStore.delete(key);
      jobPosting.setPdfStorageKey(null);
      await this.jobPostingRepository.save(jobPosting);
    }

    if (expired.length > 0) {
      this.logger.log(`Son başvuru tarihi geçen ${expired.length} ilanın PDF'i silindi.`);
    }

    return expired.length;
  }
}
