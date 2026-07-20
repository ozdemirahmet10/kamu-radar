import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JobPosting, JobPostingStatus } from '../../domain/entities/job-posting.entity';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../domain/repositories/job-posting.repository.interface';

@Injectable()
export class GetJobPostingByIdUseCase {
  constructor(
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
  ) {}

  async execute(id: string, onlyPublished: boolean): Promise<JobPosting> {
    const jobPosting = await this.jobPostingRepository.findById(id);

    if (!jobPosting || (onlyPublished && jobPosting.status !== JobPostingStatus.PUBLISHED)) {
      throw new NotFoundException('İlan bulunamadı');
    }

    return jobPosting;
  }
}
