import { Inject, Injectable } from '@nestjs/common';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../../job-catalog/domain/repositories/job-posting.repository.interface';
import { JobPosting } from '../../../job-catalog/domain/entities/job-posting.entity';
import {
  IUserProfileRepository,
  USER_PROFILE_REPOSITORY,
} from '../../../identity/domain/repositories/user-profile.repository.interface';
import { QualificationCodeService } from '../../../identity/application/services/qualification-code.service';
import {
  CandidateProfile,
  EligibilityRuleEngine,
  JobRequirements,
} from '../../../matching/domain/services/eligibility-rule-engine';
import { EligibilityStatus } from '../../../matching/domain/entities/eligibility-result';
import {
  FAVORITE_REPOSITORY,
  IFavoriteRepository,
} from '../../domain/repositories/favorite.repository.interface';
import { FavoriteCategory } from '../../domain/entities/favorite-category';

const DAY_MS = 24 * 60 * 60 * 1000;
const NEW_THRESHOLD_DAYS = 3;
const DEADLINE_SOON_THRESHOLD_DAYS = 3;

export interface FavoriteJobPosting {
  jobPosting: JobPosting;
  status: EligibilityStatus;
  matchPercentage: number;
  missingCriteria: string[];
  favoritedAt: Date;
  category: FavoriteCategory;
}

export interface ListMyFavoritesInput {
  userId: string;
  category?: FavoriteCategory;
  sort?: 'newest' | 'oldest';
  page: number;
  pageSize: number;
}

export interface ListMyFavoritesResult {
  items: FavoriteJobPosting[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  categoryCounts: Record<FavoriteCategory, number>;
}

function categorize(jobPosting: JobPosting, now: number): FavoriteCategory {
  const snapshot = jobPosting.snapshot;
  const endDate = snapshot.applicationWindow.endDate;
  if (endDate) {
    const daysLeft = (endDate.getTime() - now) / DAY_MS;
    if (daysLeft < 0) return FavoriteCategory.EXPIRED;
    if (daysLeft <= DEADLINE_SOON_THRESHOLD_DAYS) return FavoriteCategory.DEADLINE_SOON;
  }
  if (now - snapshot.createdAt.getTime() < NEW_THRESHOLD_DAYS * DAY_MS) {
    return FavoriteCategory.NEW;
  }
  return FavoriteCategory.ACTIVE;
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
    qualificationCodes: snapshot.qualificationCodes
      .map((q) => q.code)
      .filter((code) => knownCodes.has(code)),
  };
}

@Injectable()
export class ListMyFavoritesUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY) private readonly favoriteRepository: IFavoriteRepository,
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
    @Inject(USER_PROFILE_REPOSITORY) private readonly profileRepository: IUserProfileRepository,
    private readonly eligibilityRuleEngine: EligibilityRuleEngine,
    private readonly qualificationCodeService: QualificationCodeService,
  ) {}

  async execute(input: ListMyFavoritesInput): Promise<ListMyFavoritesResult> {
    const favorites = await this.favoriteRepository.listByUser(input.userId);
    const jobPostings = await this.jobPostingRepository.findByIds(
      favorites.map((f) => f.jobPostingId),
    );
    const jobPostingById = new Map(jobPostings.map((jobPosting) => [jobPosting.id, jobPosting]));

    const profile = await this.profileRepository.findByUserId(input.userId);
    const profileSnapshot = profile?.snapshot;

    const qualificationCodes = await this.qualificationCodeService.getCodesForDepartment(
      profileSnapshot?.graduationDepartmentId ?? null,
    );
    const allJobQualificationCodes = jobPostings.flatMap((jobPosting) =>
      jobPosting.snapshot.qualificationCodes.map((q) => q.code),
    );
    const knownCodes = await this.qualificationCodeService.filterKnownCodes(
      allJobQualificationCodes,
    );

    const candidateProfile: CandidateProfile = {
      kpssScoreType: profileSnapshot?.kpssScore?.scoreType ?? null,
      kpssScore: profileSnapshot?.kpssScore?.score ?? null,
      birthDate: profileSnapshot?.birthDate ?? null,
      educationLevel: profileSnapshot?.educationLevel ?? null,
      preferredCityIds: profileSnapshot?.preferredCityIds ?? [],
      qualificationCodes: qualificationCodes.map((q) => q.code),
    };

    const now = Date.now();
    const allItems: FavoriteJobPosting[] = [];
    for (const favorite of favorites) {
      const jobPosting = jobPostingById.get(favorite.jobPostingId);
      if (!jobPosting) continue;
      const result = this.eligibilityRuleEngine.evaluate(
        candidateProfile,
        toJobRequirements(jobPosting, knownCodes),
      );
      allItems.push({
        jobPosting,
        status: result.status,
        matchPercentage: result.matchPercentage,
        missingCriteria: result.missingCriteria,
        favoritedAt: favorite.createdAt,
        category: categorize(jobPosting, now),
      });
    }

    const categoryCounts: Record<FavoriteCategory, number> = {
      [FavoriteCategory.ACTIVE]: 0,
      [FavoriteCategory.NEW]: 0,
      [FavoriteCategory.DEADLINE_SOON]: 0,
      [FavoriteCategory.EXPIRED]: 0,
    };
    for (const item of allItems) {
      categoryCounts[item.category] += 1;
    }

    const filtered = input.category
      ? allItems.filter((item) => item.category === input.category)
      : allItems;

    filtered.sort((a, b) =>
      input.sort === 'oldest'
        ? a.favoritedAt.getTime() - b.favoritedAt.getTime()
        : b.favoritedAt.getTime() - a.favoritedAt.getTime(),
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
      categoryCounts,
    };
  }
}
