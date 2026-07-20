import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../../job-catalog/domain/repositories/job-posting.repository.interface';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';

@Injectable()
export class AddApplicationUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
  ) {}

  async execute(userId: string, jobPostingId: string): Promise<void> {
    const jobPosting = await this.jobPostingRepository.findById(jobPostingId);
    if (!jobPosting) {
      throw new NotFoundException('İlan bulunamadı.');
    }
    await this.applicationRepository.add(userId, jobPostingId);
  }
}
