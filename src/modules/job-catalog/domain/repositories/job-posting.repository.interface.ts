import {
  EducationLevel,
  EmploymentType,
  InstitutionType,
  JobPosting,
  JobPostingStatus,
} from '../entities/job-posting.entity';

export const JOB_POSTING_REPOSITORY = Symbol('JOB_POSTING_REPOSITORY');

export interface ListJobPostingsFilter {
  cityId?: string;
  kpssScoreType?: string;
  keyword?: string;
  minKpssScore?: number;
  maxKpssScore?: number;
  institutionType?: InstitutionType;
  employmentType?: EmploymentType;
  minimumEducationLevel?: EducationLevel;
  statuses?: JobPostingStatus[];
  /** true verilirse yalnızca arşivlenmiş bir başvuru dokümanı (PDF) olan ilanlar döner. */
  hasPdf?: boolean;
  /** Belirtilirse, yalnızca bu tarihten sonra eklenen ilanlar döner (örn. "bugün eklenenler"). */
  createdAfter?: Date;
  /** Belirtilirse, yalnızca son başvuru tarihi bugünden itibaren N gün içinde olan ilanlar döner. */
  deadlineWithinDays?: number;
  page: number;
  pageSize: number;
}

export interface ListJobPostingsResult {
  items: JobPosting[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface InstitutionAggregationRow {
  institutionName: string;
  institutionType: InstitutionType | null;
  cityId: string | null;
  quotaCount: number | null;
  applicationEndDate: Date | null;
}

export interface RecentInstitutionPostingRow {
  id: string;
  institutionName: string;
  positionTitle: string;
  createdAt: Date;
}

export interface IJobPostingRepository {
  findById(id: string): Promise<JobPosting | null>;
  findByIds(ids: string[]): Promise<JobPosting[]>;
  findByFingerprint(fingerprintValue: string): Promise<JobPosting | null>;
  findBySourceAndExternalRef(sourceId: string, externalRef: string): Promise<JobPosting | null>;
  list(filter: ListJobPostingsFilter): Promise<ListJobPostingsResult>;
  save(jobPosting: JobPosting, versionChangeReason?: string): Promise<void>;
  /** Son başvuru tarihi geçmiş ve hâlâ arşivlenmiş bir PDF'i olan ilanlar (temizlik işi için). */
  findExpiredWithPdf(referenceDate: Date): Promise<JobPosting[]>;
  /** Son başvuru tarihi geçmiş ama hâlâ PUBLISHED durumunda kalan ilanlar (durum güncelleme işi için). */
  findPublishedWithPastDeadline(referenceDate: Date): Promise<JobPosting[]>;
  /** Kurumlar sayfası için — hâlâ aktif (yayında, süresi geçmemiş) ilanların kurum bazlı ham satırları. */
  findActiveForInstitutionAggregation(referenceDate: Date): Promise<InstitutionAggregationRow[]>;
  /** Takip edilen kurum bildirimleri için — belirtilen kurumlardan, belirtilen tarihten sonra yayınlanan ilanlar. */
  findRecentByInstitutionNames(
    institutionNames: string[],
    since: Date,
  ): Promise<RecentInstitutionPostingRow[]>;
}
