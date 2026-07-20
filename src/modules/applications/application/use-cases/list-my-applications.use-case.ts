import { Inject, Injectable } from '@nestjs/common';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../../job-catalog/domain/repositories/job-posting.repository.interface';
import { JobPosting } from '../../../job-catalog/domain/entities/job-posting.entity';
import {
  APPLICATION_REPOSITORY,
  ApplicationRecord,
  ApplicationStatus,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';

export interface ApplicationWithJobPosting {
  application: ApplicationRecord;
  jobPosting: JobPosting;
}

export interface ApplicationStats {
  total: number;
  documentsPending: number;
  underReview: number;
  interview: number;
  accepted: number;
  rejected: number;
  successRate: number;
}

export interface UpcomingApplicationEvent {
  jobPostingId: string;
  institutionName: string;
  positionTitle: string;
  label: string;
  date: Date;
}

export interface ListMyApplicationsInput {
  userId: string;
  status?: ApplicationStatus;
  keyword?: string;
  cityId?: string;
  kpssScoreType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sort?: 'newest' | 'oldest';
  page: number;
  pageSize: number;
}

export interface ListMyApplicationsResult {
  items: ApplicationWithJobPosting[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  stats: ApplicationStats;
  upcoming: UpcomingApplicationEvent[];
}

function computeStats(all: ApplicationWithJobPosting[]): ApplicationStats {
  const stats: ApplicationStats = {
    total: all.length,
    documentsPending: 0,
    underReview: 0,
    interview: 0,
    accepted: 0,
    rejected: 0,
    successRate: 0,
  };
  for (const item of all) {
    switch (item.application.status) {
      case 'DOCUMENTS_PENDING':
        stats.documentsPending += 1;
        break;
      case 'UNDER_REVIEW':
        stats.underReview += 1;
        break;
      case 'INTERVIEW':
        stats.interview += 1;
        break;
      case 'ACCEPTED':
        stats.accepted += 1;
        break;
      case 'REJECTED':
        stats.rejected += 1;
        break;
    }
  }
  const decided = stats.accepted + stats.rejected;
  stats.successRate = decided > 0 ? Math.round((stats.accepted / decided) * 100) : 0;
  return stats;
}

@Injectable()
export class ListMyApplicationsUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
  ) {}

  async execute(input: ListMyApplicationsInput): Promise<ListMyApplicationsResult> {
    const applications = await this.applicationRepository.listByUser(input.userId);
    const jobPostings = await this.jobPostingRepository.findByIds(
      applications.map((a) => a.jobPostingId),
    );
    const jobPostingById = new Map(jobPostings.map((jobPosting) => [jobPosting.id, jobPosting]));

    const all: ApplicationWithJobPosting[] = [];
    for (const application of applications) {
      const jobPosting = jobPostingById.get(application.jobPostingId);
      if (!jobPosting) continue;
      all.push({ application, jobPosting });
    }

    const stats = computeStats(all);

    const upcoming: UpcomingApplicationEvent[] = all
      .filter((item) => item.application.nextActionDate && item.application.nextActionLabel)
      .map((item) => ({
        jobPostingId: item.jobPosting.id,
        institutionName: item.jobPosting.snapshot.institutionName,
        positionTitle: item.jobPosting.snapshot.positionTitle,
        label: item.application.nextActionLabel!,
        date: item.application.nextActionDate!,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);

    let filtered = all;
    if (input.status) {
      filtered = filtered.filter((item) => item.application.status === input.status);
    }
    if (input.keyword) {
      const keyword = input.keyword.toLocaleLowerCase('tr-TR');
      filtered = filtered.filter((item) =>
        item.jobPosting.snapshot.institutionName.toLocaleLowerCase('tr-TR').includes(keyword),
      );
    }
    if (input.cityId) {
      filtered = filtered.filter((item) => item.jobPosting.snapshot.cityId === input.cityId);
    }
    if (input.kpssScoreType) {
      filtered = filtered.filter(
        (item) => item.jobPosting.snapshot.kpssScoreType === input.kpssScoreType,
      );
    }
    if (input.dateFrom) {
      filtered = filtered.filter((item) => item.application.createdAt >= input.dateFrom!);
    }
    if (input.dateTo) {
      filtered = filtered.filter((item) => item.application.createdAt <= input.dateTo!);
    }

    filtered.sort((a, b) =>
      input.sort === 'oldest'
        ? a.application.createdAt.getTime() - b.application.createdAt.getTime()
        : b.application.createdAt.getTime() - a.application.createdAt.getTime(),
    );

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / input.pageSize));
    const start = (input.page - 1) * input.pageSize;
    const items = filtered.slice(start, start + input.pageSize);

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      totalCount,
      totalPages,
      stats,
      upcoming,
    };
  }
}
