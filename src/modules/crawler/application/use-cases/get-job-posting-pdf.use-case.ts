import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../../job-catalog/domain/repositories/job-posting.repository.interface';
import { RAW_CONTENT_STORE, IRawContentStore } from '../ports/raw-content-store.port';

export interface JobPostingPdfResult {
  buffer: Buffer;
  fileName: string;
}

@Injectable()
export class GetJobPostingPdfUseCase {
  constructor(
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
    @Inject(RAW_CONTENT_STORE) private readonly rawContentStore: IRawContentStore,
  ) {}

  async execute(jobPostingId: string): Promise<JobPostingPdfResult> {
    const jobPosting = await this.jobPostingRepository.findById(jobPostingId);
    if (!jobPosting) {
      throw new NotFoundException('İlan bulunamadı.');
    }

    const snapshot = jobPosting.snapshot;

    if (!snapshot.pdfStorageKey) {
      throw new NotFoundException('Bu ilan için arşivlenmiş bir PDF bulunmuyor.');
    }

    const buffer = await this.rawContentStore.getBinary(snapshot.pdfStorageKey);
    if (!buffer) {
      throw new NotFoundException('PDF depoda bulunamadı.');
    }

    return { buffer, fileName: `${snapshot.institutionName}-${snapshot.positionTitle}.pdf` };
  }
}
