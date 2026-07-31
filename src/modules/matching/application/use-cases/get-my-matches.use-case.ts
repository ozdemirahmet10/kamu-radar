import { Inject, Injectable } from '@nestjs/common';
import {
  IUserProfileRepository,
  USER_PROFILE_REPOSITORY,
} from '../../../identity/domain/repositories/user-profile.repository.interface';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../../job-catalog/domain/repositories/job-posting.repository.interface';
import { QualificationCodeService } from '../../../identity/application/services/qualification-code.service';
import {
  EducationLevel,
  EmploymentType,
  InstitutionType,
  JobPosting,
  JobPostingStatus,
} from '../../../job-catalog/domain/entities/job-posting.entity';
import {
  EligibilityRuleEngine,
  JobRequirements,
} from '../../domain/services/eligibility-rule-engine';
import { EligibilityStatus } from '../../domain/entities/eligibility-result';
import {
  IMatchResultRepository,
  MATCH_RESULT_REPOSITORY,
} from '../../domain/repositories/match-result.repository.interface';

// İlan sayısı bu sınırı aşarsa (crawler kaynak sayısı arttıkça artıyor), sınırın
// ötesindeki ilanlar sayfalamada hiç görünmez hale gelir — uygunluk hesaplaması ucuz
// (saf alan karşılaştırması, LLM çağrısı yok) olduğundan sınır cömert tutulabilir;
// katalog on binlere ulaşırsa gerçek DB-taraflı sayfalamaya geçilmesi gerekir.
const MAX_CANDIDATE_POSTINGS = 3000;

export const MATCHES_SORT_BY_VALUES = [
  'matchPercentage',
  'newest',
  'oldest',
  'deadlineSoon',
  'quotaHigh',
] as const;
export type MatchesSortBy = (typeof MATCHES_SORT_BY_VALUES)[number];

export interface MatchedJobPosting {
  jobPosting: JobPosting;
  status: EligibilityStatus;
  matchPercentage: number;
  missingCriteria: string[];
}

export interface GetMyMatchesInput {
  userId: string;
  statuses?: EligibilityStatus[];
  cityId?: string;
  kpssScoreType?: string;
  minKpssScore?: number;
  maxKpssScore?: number;
  institutionType?: InstitutionType;
  employmentType?: EmploymentType;
  minimumEducationLevel?: EducationLevel;
  keyword?: string;
  hasPdf?: boolean;
  createdAfter?: Date;
  deadlineWithinDays?: number;
  sortBy?: MatchesSortBy;
  page: number;
  pageSize: number;
}

export interface GetMyMatchesResult {
  items: MatchedJobPosting[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  statusCounts: Record<EligibilityStatus, number>;
}

function sortMatches(matches: MatchedJobPosting[], sortBy: MatchesSortBy): void {
  switch (sortBy) {
    case 'newest':
      matches.sort(
        (a, b) => b.jobPosting.snapshot.createdAt.getTime() - a.jobPosting.snapshot.createdAt.getTime(),
      );
      break;
    case 'oldest':
      matches.sort(
        (a, b) => a.jobPosting.snapshot.createdAt.getTime() - b.jobPosting.snapshot.createdAt.getTime(),
      );
      break;
    case 'deadlineSoon':
      matches.sort((a, b) => {
        const aEnd = a.jobPosting.snapshot.applicationWindow.endDate;
        const bEnd = b.jobPosting.snapshot.applicationWindow.endDate;
        if (!aEnd && !bEnd) return 0;
        if (!aEnd) return 1;
        if (!bEnd) return -1;
        return aEnd.getTime() - bEnd.getTime();
      });
      break;
    case 'quotaHigh':
      matches.sort((a, b) => (b.jobPosting.snapshot.quotaCount ?? 0) - (a.jobPosting.snapshot.quotaCount ?? 0));
      break;
    case 'matchPercentage':
    default:
      matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
      break;
  }
}

function toJobRequirements(jobPosting: JobPosting, knownCodes: Set<string>): JobRequirements {
  const snapshot = jobPosting.snapshot;
  return {
    kpssScoreType: snapshot.kpssScoreType,
    minKpssScore: snapshot.minKpssScore,
    minAge: snapshot.minAge,
    maxAge: snapshot.maxAge,
    minimumEducationLevel: snapshot.minimumEducationLevel,
    cityId: snapshot.cityId,
    // Sadece ÖSYM referans tablosunda kayıtlı gerçek nitelik kodları dikkate alınır;
    // ilanlarda LLM ile çıkarılan alan bazen KPSS puan türü gibi nitelik kodu
    // olmayan değerler içerebiliyor, bunlar eşleştirmeyi hatalı şekilde ELEMEMELİ.
    qualificationCodes: snapshot.qualificationCodes
      .map((q) => q.code)
      .filter((code) => knownCodes.has(code)),
  };
}

@Injectable()
export class GetMyMatchesUseCase {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY) private readonly profileRepository: IUserProfileRepository,
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
    @Inject(MATCH_RESULT_REPOSITORY) private readonly matchResultRepository: IMatchResultRepository,
    private readonly eligibilityRuleEngine: EligibilityRuleEngine,
    private readonly qualificationCodeService: QualificationCodeService,
  ) {}

  async execute(input: GetMyMatchesInput): Promise<GetMyMatchesResult> {
    const profile = await this.profileRepository.findByUserId(input.userId);
    const profileSnapshot = profile?.snapshot;

    const [{ items: jobPostings }, qualificationCodes] = await Promise.all([
      this.jobPostingRepository.list({
        statuses: [JobPostingStatus.PUBLISHED],
        cityId: input.cityId,
        kpssScoreType: input.kpssScoreType,
        minKpssScore: input.minKpssScore,
        maxKpssScore: input.maxKpssScore,
        institutionType: input.institutionType,
        employmentType: input.employmentType,
        minimumEducationLevel: input.minimumEducationLevel,
        keyword: input.keyword,
        hasPdf: input.hasPdf,
        createdAfter: input.createdAfter,
        deadlineWithinDays: input.deadlineWithinDays,
        page: 1,
        pageSize: MAX_CANDIDATE_POSTINGS,
      }),
      this.qualificationCodeService.getCodesForDepartment(
        profileSnapshot?.graduationDepartmentId ?? null,
      ),
    ]);

    const allJobQualificationCodes = jobPostings.flatMap((jobPosting) =>
      jobPosting.snapshot.qualificationCodes.map((q) => q.code),
    );
    const knownCodes = await this.qualificationCodeService.filterKnownCodes(
      allJobQualificationCodes,
    );

    const candidateProfile = {
      kpssScoreType: profileSnapshot?.kpssScore?.scoreType ?? null,
      kpssScore: profileSnapshot?.kpssScore?.score ?? null,
      birthDate: profileSnapshot?.birthDate ?? null,
      educationLevel: profileSnapshot?.educationLevel ?? null,
      preferredCityIds: profileSnapshot?.preferredCityIds ?? [],
      qualificationCodes: qualificationCodes.map((q) => q.code),
    };

    const allMatches: MatchedJobPosting[] = jobPostings.map((jobPosting) => {
      const result = this.eligibilityRuleEngine.evaluate(
        candidateProfile,
        toJobRequirements(jobPosting, knownCodes),
      );
      return {
        jobPosting,
        status: result.status,
        matchPercentage: result.matchPercentage,
        missingCriteria: result.missingCriteria,
      };
    });

    await Promise.all(
      allMatches.map((match) =>
        this.matchResultRepository.upsert(
          input.userId,
          match.jobPosting.id,
          match.status,
          match.missingCriteria,
        ),
      ),
    );

    const statusCounts: Record<EligibilityStatus, number> = {
      [EligibilityStatus.ELIGIBLE]: 0,
      [EligibilityStatus.PARTIALLY_ELIGIBLE]: 0,
      [EligibilityStatus.NOT_ELIGIBLE]: 0,
    };
    for (const match of allMatches) {
      statusCounts[match.status] += 1;
    }

    const filtered = input.statuses?.length
      ? allMatches.filter((match) => input.statuses!.includes(match.status))
      : allMatches;

    sortMatches(filtered, input.sortBy ?? 'matchPercentage');

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
      statusCounts,
    };
  }
}
