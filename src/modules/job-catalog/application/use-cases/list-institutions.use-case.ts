import { Inject, Injectable } from '@nestjs/common';
import { InstitutionType } from '../../domain/entities/job-posting.entity';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../domain/repositories/job-posting.repository.interface';

export type InstitutionSortBy = 'activeCount' | 'nearestDeadline';

export interface ListInstitutionsInput {
  keyword?: string;
  institutionType?: InstitutionType;
  sortBy?: InstitutionSortBy;
  page: number;
  pageSize: number;
}

export interface InstitutionSummary {
  institutionName: string;
  institutionType: InstitutionType | null;
  activeJobPostingCount: number;
  totalQuota: number | null;
  nearestDeadline: Date | null;
  cityIds: string[];
}

export interface ListInstitutionsResult {
  items: InstitutionSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class ListInstitutionsUseCase {
  constructor(
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
  ) {}

  async execute(input: ListInstitutionsInput): Promise<ListInstitutionsResult> {
    const rows = await this.jobPostingRepository.findActiveForInstitutionAggregation(new Date());

    const grouped = new Map<
      string,
      {
        institutionType: InstitutionType | null;
        count: number;
        totalQuota: number;
        hasQuota: boolean;
        nearestDeadline: Date | null;
        cityIds: Set<string>;
      }
    >();

    for (const row of rows) {
      const group = grouped.get(row.institutionName) ?? {
        institutionType: null,
        count: 0,
        totalQuota: 0,
        hasQuota: false,
        nearestDeadline: null,
        cityIds: new Set<string>(),
      };

      group.institutionType = group.institutionType ?? row.institutionType;
      group.count += 1;
      if (row.quotaCount !== null) {
        group.totalQuota += row.quotaCount;
        group.hasQuota = true;
      }
      if (row.applicationEndDate !== null) {
        group.nearestDeadline =
          group.nearestDeadline === null || row.applicationEndDate < group.nearestDeadline
            ? row.applicationEndDate
            : group.nearestDeadline;
      }
      if (row.cityId !== null) {
        group.cityIds.add(row.cityId);
      }

      grouped.set(row.institutionName, group);
    }

    let summaries: InstitutionSummary[] = Array.from(grouped.entries()).map(
      ([institutionName, group]) => ({
        institutionName,
        institutionType: group.institutionType,
        activeJobPostingCount: group.count,
        totalQuota: group.hasQuota ? group.totalQuota : null,
        nearestDeadline: group.nearestDeadline,
        cityIds: Array.from(group.cityIds),
      }),
    );

    if (input.keyword) {
      const keyword = input.keyword.toLocaleLowerCase('tr-TR');
      summaries = summaries.filter((s) =>
        s.institutionName.toLocaleLowerCase('tr-TR').includes(keyword),
      );
    }
    if (input.institutionType) {
      summaries = summaries.filter((s) => s.institutionType === input.institutionType);
    }

    const sortBy = input.sortBy ?? 'activeCount';
    summaries.sort((a, b) => {
      if (sortBy === 'nearestDeadline') {
        if (a.nearestDeadline === null) return 1;
        if (b.nearestDeadline === null) return -1;
        return a.nearestDeadline.getTime() - b.nearestDeadline.getTime();
      }
      return b.activeJobPostingCount - a.activeJobPostingCount;
    });

    const page = input.page ?? DEFAULT_PAGE;
    const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
    const totalCount = summaries.length;
    const start = (page - 1) * pageSize;
    const items = summaries.slice(start, start + pageSize);

    return {
      items,
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    };
  }
}
