import { Inject, Injectable } from '@nestjs/common';
import {
  EducationLevel,
  EmploymentType,
  InstitutionType,
  JobPostingStatus,
} from '../../domain/entities/job-posting.entity';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
  ListJobPostingsResult,
} from '../../domain/repositories/job-posting.repository.interface';

export interface ListJobPostingsInput {
  cityId?: string;
  kpssScoreType?: string;
  minKpssScore?: number;
  maxKpssScore?: number;
  institutionType?: InstitutionType;
  employmentType?: EmploymentType;
  minimumEducationLevel?: EducationLevel;
  keyword?: string;
  hasPdf?: boolean;
  page?: number;
  pageSize?: number;
  onlyPublished: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class ListJobPostingsUseCase {
  constructor(
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
  ) {}

  async execute(input: ListJobPostingsInput): Promise<ListJobPostingsResult> {
    return this.jobPostingRepository.list({
      cityId: input.cityId,
      kpssScoreType: input.kpssScoreType,
      minKpssScore: input.minKpssScore,
      maxKpssScore: input.maxKpssScore,
      institutionType: input.institutionType,
      employmentType: input.employmentType,
      minimumEducationLevel: input.minimumEducationLevel,
      keyword: input.keyword,
      hasPdf: input.hasPdf,
      page: input.page ?? DEFAULT_PAGE,
      pageSize: input.pageSize ?? DEFAULT_PAGE_SIZE,
      statuses: input.onlyPublished ? [JobPostingStatus.PUBLISHED] : undefined,
    });
  }
}
