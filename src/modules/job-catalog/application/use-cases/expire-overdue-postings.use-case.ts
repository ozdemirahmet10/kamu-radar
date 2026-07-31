import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../domain/repositories/job-posting.repository.interface';

@Injectable()
export class ExpireOverduePostingsUseCase {
  private readonly logger = new Logger(ExpireOverduePostingsUseCase.name);

  constructor(
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
  ) {}

  async execute(): Promise<number> {
    const overdue = await this.jobPostingRepository.findPublishedWithPastDeadline(new Date());

    for (const jobPosting of overdue) {
      jobPosting.expire();
      await this.jobPostingRepository.save(jobPosting);
    }

    if (overdue.length > 0) {
      this.logger.log(`Son başvuru tarihi geçen ${overdue.length} ilan EXPIRED durumuna alındı.`);
    }

    return overdue.length;
  }
}
