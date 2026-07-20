export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Envelope<T> {
  data: T;
  meta: Record<string, unknown> | null;
}

interface ProblemDetails {
  detail: string;
  code: string;
  status: number;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const { accessToken, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json();

  if (!response.ok) {
    const problem = body as ProblemDetails;
    throw new ApiError(problem.detail ?? 'Beklenmeyen bir hata oluştu', response.status, problem.code);
  }

  return (body as Envelope<T>).data;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export type MilitaryStatus = 'YAPILDI' | 'MUAF' | 'TECILLI' | 'YOK';
export type DisabilityStatus = 'YOK' | 'VAR';

export interface ProfileQualificationCode {
  code: string;
  description: string;
}

export interface ProfileResponse {
  userId: string;
  birthDate: string | null;
  educationLevel: EducationLevel | null;
  graduationSchool: string | null;
  graduationDepartmentId: string | null;
  graduationDepartmentName: string | null;
  qualificationCodes: ProfileQualificationCode[];
  kpssScoreType: string | null;
  kpssScore: number | null;
  kpssYear: number | null;
  drivingLicense: boolean;
  ydsScore: number | null;
  ydsType: string | null;
  militaryStatus: MilitaryStatus | null;
  disabilityStatus: DisabilityStatus;
  certificates: string[];
  preferredCityIds: string[];
}

export interface UpdateProfilePayload {
  birthDate?: string;
  educationLevel?: EducationLevel;
  graduationSchool?: string;
  graduationDepartmentId?: string;
  kpssScoreType?: string;
  kpssScore?: number;
  kpssYear?: number;
  drivingLicense?: boolean;
  ydsScore?: number;
  ydsType?: string;
  militaryStatus?: MilitaryStatus;
  disabilityStatus?: DisabilityStatus;
  certificates?: string[];
  preferredCityIds?: string[];
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiFetch<UserResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  login: (payload: LoginPayload) =>
    apiFetch<TokenPair>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  refresh: (refreshToken: string) =>
    apiFetch<TokenPair>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  logout: (accessToken: string) =>
    apiFetch<void>('/auth/logout', { method: 'POST', accessToken }),

  me: (accessToken: string) => apiFetch<UserResponse>('/auth/me', { accessToken }),

  changePassword: (
    payload: { currentPassword: string; newPassword: string },
    accessToken: string,
  ) =>
    apiFetch<void>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
      accessToken,
    }),

  updateAccount: (payload: { fullName?: string; phone?: string }, accessToken: string) =>
    apiFetch<UserResponse>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
      accessToken,
    }),

  forgotPassword: (email: string) =>
    apiFetch<void>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    apiFetch<void>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),

  verifyEmail: (token: string) =>
    apiFetch<void>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),

  resendVerification: (accessToken: string) =>
    apiFetch<void>('/auth/resend-verification', { method: 'POST', accessToken }),
};

export interface Session {
  id: string;
  deviceInfo: string | null;
  createdAt: string;
  expiresAt: string;
}

export const sessionsApi = {
  list: (accessToken: string) => apiFetch<Session[]>('/auth/sessions', { accessToken }),

  revoke: (sessionId: string, accessToken: string) =>
    apiFetch<void>(`/auth/sessions/${sessionId}`, { method: 'DELETE', accessToken }),
};

export const profileApi = {
  getMine: (accessToken: string) => apiFetch<ProfileResponse>('/profile/me', { accessToken }),

  update: (payload: UpdateProfilePayload, accessToken: string) =>
    apiFetch<ProfileResponse>('/profile/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
      accessToken,
    }),
};

export interface City {
  id: string;
  name: string;
  plateCode: number;
}

export const citiesApi = {
  list: () => apiFetch<City[]>('/cities'),
};

export interface Institution {
  institutionName: string;
  institutionType: InstitutionType | null;
  activeJobPostingCount: number;
  totalQuota: number | null;
  nearestDeadline: string | null;
  cityIds: string[];
}

export interface InstitutionListResponse {
  items: Institution[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ListInstitutionsParams {
  keyword?: string;
  institutionType?: InstitutionType;
  sortBy?: 'activeCount' | 'nearestDeadline';
  page?: number;
  pageSize?: number;
}

export const institutionsApi = {
  list: (params: ListInstitutionsParams = {}) =>
    apiFetch<InstitutionListResponse>(`/institutions${buildQueryString(params)}`),
};

export interface GraduationDepartment {
  id: string;
  name: string;
}

export const graduationDepartmentsApi = {
  list: (educationLevel: EducationLevel) =>
    apiFetch<GraduationDepartment[]>(
      `/reference-data/graduation-departments${buildQueryString({ educationLevel })}`,
    ),
};

export interface QualificationCode {
  code: string;
  description: string | null;
}

export type InstitutionType =
  | 'BAKANLIK'
  | 'BELEDIYE'
  | 'UNIVERSITE'
  | 'VALILIK'
  | 'IL_MUDURLUGU'
  | 'KAYMAKAMLIK'
  | 'DIGER';

export type EmploymentType =
  | 'SUREKLI_ISCI'
  | 'MEMUR'
  | 'SOZLESMELI_PERSONEL'
  | 'GECICI_PERSONEL';

export type EducationLevel = 'ILKOGRETIM' | 'LISE' | 'ON_LISANS' | 'LISANS' | 'YUKSEK_LISANS';

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  BAKANLIK: 'Bakanlık',
  BELEDIYE: 'Belediye',
  UNIVERSITE: 'Üniversite',
  VALILIK: 'Valilik',
  IL_MUDURLUGU: 'İl Müdürlüğü',
  KAYMAKAMLIK: 'Kaymakamlık',
  DIGER: 'Diğer',
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  SUREKLI_ISCI: 'Sürekli İşçi',
  MEMUR: 'Memur',
  SOZLESMELI_PERSONEL: 'Sözleşmeli Personel',
  GECICI_PERSONEL: 'Geçici Personel',
};

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  ILKOGRETIM: 'İlköğretim',
  LISE: 'Lise',
  ON_LISANS: 'Ön Lisans',
  LISANS: 'Lisans',
  YUKSEK_LISANS: 'Yüksek Lisans',
};

export const MILITARY_STATUS_LABELS: Record<MilitaryStatus, string> = {
  YAPILDI: 'Yapıldı',
  MUAF: 'Muaf',
  TECILLI: 'Tecilli',
  YOK: 'Yok / İlgisiz',
};

export const DISABILITY_STATUS_LABELS: Record<DisabilityStatus, string> = {
  YOK: 'Yok',
  VAR: 'Var',
};

export interface JobPosting {
  id: string;
  institutionName: string;
  institutionType: InstitutionType | null;
  positionTitle: string;
  cityId: string | null;
  quotaCount: number | null;
  employmentType: EmploymentType | null;
  minimumEducationLevel: EducationLevel | null;
  kpssScoreType: string | null;
  minKpssScore: number | null;
  minAge: number | null;
  maxAge: number | null;
  requiresExperience: boolean;
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  applicationUrl: string | null;
  description: string | null;
  hasPdf: boolean;
  status: string;
  qualificationCodes: QualificationCode[];
  departments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JobPostingListResponse {
  items: JobPosting[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ListJobPostingsParams {
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
}

function buildQueryString(params: object): string {
  const searchParams = new URLSearchParams();
  Object.entries(params as Record<string, string | number | boolean | undefined>).forEach(
    ([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value));
      }
    },
  );
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const jobPostingsApi = {
  list: (params: ListJobPostingsParams = {}) =>
    apiFetch<JobPostingListResponse>(`/job-postings${buildQueryString(params)}`),

  getById: (id: string) => apiFetch<JobPosting>(`/job-postings/${id}`),
};

export type EligibilityStatus = 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE';

export interface MatchedJobPosting {
  jobPosting: JobPosting;
  status: EligibilityStatus;
  matchPercentage: number;
  missingCriteria: string[];
}

export interface MyMatchesListResponse {
  items: MatchedJobPosting[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  statusCounts: Record<EligibilityStatus, number>;
}

export interface GetMyMatchesParams {
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
  createdAfter?: string;
  deadlineWithinDays?: number;
  page?: number;
  pageSize?: number;
}

export const matchesApi = {
  list: (params: GetMyMatchesParams = {}, accessToken: string) =>
    apiFetch<MyMatchesListResponse>(
      `/me/matches${buildQueryString({
        statuses: params.statuses?.join(','),
        cityId: params.cityId,
        kpssScoreType: params.kpssScoreType,
        minKpssScore: params.minKpssScore,
        maxKpssScore: params.maxKpssScore,
        institutionType: params.institutionType,
        employmentType: params.employmentType,
        minimumEducationLevel: params.minimumEducationLevel,
        keyword: params.keyword,
        hasPdf: params.hasPdf,
        createdAfter: params.createdAfter,
        deadlineWithinDays: params.deadlineWithinDays,
        page: params.page,
        pageSize: params.pageSize,
      })}`,
      { accessToken },
    ),
};

export type FavoriteCategory = 'ACTIVE' | 'NEW' | 'DEADLINE_SOON' | 'EXPIRED';

export interface FavoriteJobPosting {
  jobPosting: JobPosting;
  status: EligibilityStatus;
  matchPercentage: number;
  missingCriteria: string[];
  favoritedAt: string;
  category: FavoriteCategory;
}

export interface FavoriteJobPostingListResponse {
  items: FavoriteJobPosting[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  categoryCounts: Record<FavoriteCategory, number>;
}

export interface ListMyFavoritesParams {
  category?: FavoriteCategory;
  sort?: 'newest' | 'oldest';
  page?: number;
  pageSize?: number;
}

export const favoritesApi = {
  list: (params: ListMyFavoritesParams = {}, accessToken: string) =>
    apiFetch<FavoriteJobPostingListResponse>(
      `/me/favorites${buildQueryString(params)}`,
      { accessToken },
    ),

  listIds: (accessToken: string) => apiFetch<string[]>('/me/favorites/ids', { accessToken }),

  add: (jobPostingId: string, accessToken: string) =>
    apiFetch<void>(`/me/favorites/${jobPostingId}`, { method: 'POST', accessToken }),

  remove: (jobPostingId: string, accessToken: string) =>
    apiFetch<void>(`/me/favorites/${jobPostingId}`, { method: 'DELETE', accessToken }),
};

export type NotificationType = 'NEW_MATCH' | 'DEADLINE_SOON';

export interface NotificationRecord {
  id: string;
  jobPostingId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationRecord[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  unreadCount: number;
}

export interface ListMyNotificationsParams {
  page?: number;
  pageSize?: number;
}

export const notificationsApi = {
  list: (params: ListMyNotificationsParams = {}, accessToken: string) =>
    apiFetch<NotificationListResponse>(
      `/me/notifications${buildQueryString(params)}`,
      { accessToken },
    ),

  unreadCount: (accessToken: string) =>
    apiFetch<{ count: number }>('/me/notifications/unread-count', { accessToken }),

  markRead: (id: string, accessToken: string) =>
    apiFetch<void>(`/me/notifications/${id}/read`, { method: 'PATCH', accessToken }),

  markAllRead: (accessToken: string) =>
    apiFetch<void>('/me/notifications/read-all', { method: 'POST', accessToken }),
};

export interface NotificationPreference {
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

export const notificationPreferenceApi = {
  get: (accessToken: string) =>
    apiFetch<NotificationPreference>('/me/notifications/preference', { accessToken }),

  update: (patch: Partial<NotificationPreference>, accessToken: string) =>
    apiFetch<void>('/me/notifications/preference', {
      method: 'PATCH',
      body: JSON.stringify(patch),
      accessToken,
    }),
};

export type ApplicationStatus =
  | 'DOCUMENTS_PENDING'
  | 'UNDER_REVIEW'
  | 'INTERVIEW'
  | 'ACCEPTED'
  | 'REJECTED';

export interface JobApplication {
  id: string;
  jobPosting: JobPosting;
  status: ApplicationStatus;
  note: string | null;
  nextActionLabel: string | null;
  nextActionDate: string | null;
  createdAt: string;
  updatedAt: string;
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
  date: string;
}

export interface ApplicationListResponse {
  items: JobApplication[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  stats: ApplicationStats;
  upcoming: UpcomingApplicationEvent[];
}

export interface ListMyApplicationsParams {
  status?: ApplicationStatus;
  keyword?: string;
  cityId?: string;
  kpssScoreType?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  pageSize?: number;
}

export interface UpdateApplicationPayload {
  status?: ApplicationStatus;
  note?: string;
  nextActionLabel?: string;
  nextActionDate?: string;
}

export const applicationsApi = {
  list: (params: ListMyApplicationsParams = {}, accessToken: string) =>
    apiFetch<ApplicationListResponse>(
      `/me/applications${buildQueryString(params)}`,
      { accessToken },
    ),

  listIds: (accessToken: string) => apiFetch<string[]>('/me/applications/ids', { accessToken }),

  add: (jobPostingId: string, accessToken: string) =>
    apiFetch<void>(`/me/applications/${jobPostingId}`, { method: 'POST', accessToken }),

  update: (jobPostingId: string, payload: UpdateApplicationPayload, accessToken: string) =>
    apiFetch<void>(`/me/applications/${jobPostingId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      accessToken,
    }),

  remove: (jobPostingId: string, accessToken: string) =>
    apiFetch<void>(`/me/applications/${jobPostingId}`, { method: 'DELETE', accessToken }),
};

export interface AdminJobPosting extends JobPosting {
  sourceId: string;
  sourceName: string;
}

export interface AdminJobPostingListResponse {
  items: AdminJobPosting[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AdminJobPostingPayload {
  institutionName?: string;
  positionTitle?: string;
  institutionType?: InstitutionType;
  cityId?: string;
  quotaCount?: number;
  employmentType?: EmploymentType;
  minimumEducationLevel?: EducationLevel;
  kpssScoreType?: string;
  minKpssScore?: number;
  minAge?: number;
  maxAge?: number;
  requiresExperience?: boolean;
  applicationStartDate?: string;
  applicationEndDate?: string;
  applicationUrl?: string;
  description?: string;
  qualificationCodes?: QualificationCode[];
  departments?: string[];
}

export interface ListAdminJobPostingsParams {
  keyword?: string;
  institutionType?: InstitutionType;
  employmentType?: EmploymentType;
  minimumEducationLevel?: EducationLevel;
  page?: number;
  pageSize?: number;
}

export const adminJobPostingsApi = {
  list: (params: ListAdminJobPostingsParams = {}, accessToken: string) =>
    apiFetch<AdminJobPostingListResponse>(
      `/admin/job-postings${buildQueryString({ ...params, scope: 'all' })}`,
      { accessToken },
    ),

  getById: (id: string, accessToken: string) =>
    apiFetch<AdminJobPosting>(`/admin/job-postings/${id}`, { accessToken }),

  create: (payload: AdminJobPostingPayload, accessToken: string) =>
    apiFetch<JobPosting>('/admin/job-postings', {
      method: 'POST',
      body: JSON.stringify(payload),
      accessToken,
    }),

  update: (id: string, payload: AdminJobPostingPayload, accessToken: string) =>
    apiFetch<JobPosting>(`/admin/job-postings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      accessToken,
    }),

  archive: (id: string, accessToken: string) =>
    apiFetch<void>(`/admin/job-postings/${id}`, { method: 'DELETE', accessToken }),

  approve: (id: string, accessToken: string) =>
    apiFetch<JobPosting>(`/admin/job-postings/${id}/approve`, {
      method: 'POST',
      accessToken,
    }),

  listVersions: (id: string, accessToken: string) =>
    apiFetch<JobPostingVersion[]>(`/admin/job-postings/${id}/versions`, { accessToken }),
};

export interface JobPostingVersion {
  id: string;
  snapshot: Record<string, unknown>;
  changedAt: string;
  changeReason: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  isEmailVerified: boolean;
  isSuspended: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ListAdminUsersParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export const adminUsersApi = {
  list: (params: ListAdminUsersParams = {}, accessToken: string) =>
    apiFetch<AdminUserListResponse>(`/admin/users${buildQueryString(params)}`, { accessToken }),

  updateRole: (id: string, role: string, accessToken: string) =>
    apiFetch<AdminUser>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
      accessToken,
    }),

  suspend: (id: string, accessToken: string) =>
    apiFetch<AdminUser>(`/admin/users/${id}/suspend`, { method: 'POST', accessToken }),

  reactivate: (id: string, accessToken: string) =>
    apiFetch<AdminUser>(`/admin/users/${id}/reactivate`, { method: 'POST', accessToken }),

  remove: (id: string, accessToken: string) =>
    apiFetch<AdminUser>(`/admin/users/${id}`, { method: 'DELETE', accessToken }),

  restore: (id: string, accessToken: string) =>
    apiFetch<AdminUser>(`/admin/users/${id}/restore`, { method: 'POST', accessToken }),

  getById: (id: string, accessToken: string) =>
    apiFetch<AdminUserDetail>(`/admin/users/${id}`, { accessToken }),
};

export interface AdminUserProfileSummary {
  birthDate: string | null;
  educationLevel: EducationLevel | null;
  graduationSchool: string | null;
  graduationDepartmentName: string | null;
  kpssScoreType: string | null;
  kpssScore: number | null;
  kpssYear: number | null;
  drivingLicense: boolean;
  ydsScore: number | null;
  ydsType: string | null;
  militaryStatus: MilitaryStatus | null;
  disabilityStatus: DisabilityStatus;
  certificates: string[];
  qualificationCodes: ProfileQualificationCode[];
}

export interface AdminUserAuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: unknown;
  createdAt: string;
  actorEmail: string | null;
  actorFullName: string | null;
}

export interface AdminUserDetail {
  user: AdminUser;
  profile: AdminUserProfileSummary | null;
  matchSummary: Record<EligibilityStatus, number>;
  recentAuditLogs: AdminUserAuditLogEntry[];
}

export type CrawlStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL';

export interface CrawlSource {
  id: string;
  name: string;
  baseUrl: string;
  adapterKey: string;
  crawlFrequencyCron: string;
  isActive: boolean;
  lastCrawledAt: string | null;
  lastStatus: CrawlStatus | null;
}

export interface CrawlRun {
  id: string;
  sourceId: string;
  startedAt: string;
  finishedAt: string | null;
  status: CrawlStatus;
  itemsFound: number;
  itemsNew: number;
  errorMessage: string | null;
}

export interface TriggerCrawlResult {
  itemsFound: number;
  itemsNew: number;
  itemsSkipped: number;
  itemsFailed: number;
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorFullName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changes: unknown;
  createdAt: string;
}

export interface AuditLogListResponse {
  items: AuditLogEntry[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ListAuditLogsParams {
  entityType?: string;
  actorUserId?: string;
  page?: number;
  pageSize?: number;
}

export const adminAuditLogApi = {
  list: (params: ListAuditLogsParams = {}, accessToken: string) =>
    apiFetch<AuditLogListResponse>(`/admin/audit-logs${buildQueryString(params)}`, { accessToken }),
};

export interface AdminDashboardStats {
  users: {
    total: number;
    suspended: number;
    deleted: number;
    active: number;
  };
  jobPostings: {
    total: number;
    byStatus: Record<string, number>;
  };
  crawler: {
    totalSources: number;
    activeSources: number;
    failedRuns: number;
  };
}

export interface AdminQualificationCode {
  id: string;
  code: string;
  description: string;
  educationLevel: EducationLevel;
  departmentNames: string[];
  isUniversal: boolean;
}

export interface AdminQualificationCodeListResponse {
  items: AdminQualificationCode[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AdminQualificationCodeStats {
  totalCodes: number;
  totalDepartments: number;
  codesByLevel: Record<string, number>;
}

export interface SearchAdminQualificationCodesParams {
  keyword?: string;
  educationLevel?: EducationLevel;
  page?: number;
  pageSize?: number;
}

export const adminQualificationCodesApi = {
  search: (params: SearchAdminQualificationCodesParams = {}, accessToken: string) =>
    apiFetch<AdminQualificationCodeListResponse>(
      `/admin/qualification-codes${buildQueryString(params)}`,
      { accessToken },
    ),

  byDepartment: (departmentId: string, accessToken: string) =>
    apiFetch<ProfileQualificationCode[]>(
      `/admin/qualification-codes/by-department/${departmentId}`,
      { accessToken },
    ),

  stats: (accessToken: string) =>
    apiFetch<AdminQualificationCodeStats>('/admin/qualification-codes/stats', { accessToken }),
};

export const adminDashboardApi = {
  stats: (accessToken: string) =>
    apiFetch<AdminDashboardStats>('/admin/dashboard/stats', { accessToken }),
};

export interface CrawlSourcePayload {
  name?: string;
  baseUrl?: string;
  adapterKey?: string;
  crawlFrequencyCron?: string;
  isActive?: boolean;
}

export const adminCrawlApi = {
  listSources: (accessToken: string) =>
    apiFetch<CrawlSource[]>('/admin/crawl-sources', { accessToken }),

  listRuns: (accessToken: string) =>
    apiFetch<CrawlRun[]>('/admin/crawl-sources/runs', { accessToken }),

  trigger: (id: string, accessToken: string, maxItems?: number) =>
    apiFetch<TriggerCrawlResult>(`/admin/crawl-sources/${id}/trigger`, {
      method: 'POST',
      body: JSON.stringify({ maxItems }),
      accessToken,
    }),

  create: (payload: CrawlSourcePayload, accessToken: string) =>
    apiFetch<CrawlSource>('/admin/crawl-sources', {
      method: 'POST',
      body: JSON.stringify(payload),
      accessToken,
    }),

  update: (id: string, payload: CrawlSourcePayload, accessToken: string) =>
    apiFetch<CrawlSource>(`/admin/crawl-sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      accessToken,
    }),

  listAdapters: (accessToken: string) =>
    apiFetch<{ adapterKey: string }[]>('/admin/crawl-sources/adapters', { accessToken }),
};

export interface ComponentHealth {
  status: 'ok' | 'error';
  latencyMs: number | null;
  error?: string;
}

export interface SystemHealth {
  database: ComponentHealth;
  redis: ComponentHealth;
  minio: ComponentHealth;
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  checkedAt: string;
}

export const adminSystemHealthApi = {
  check: (accessToken: string) =>
    apiFetch<SystemHealth>('/admin/system-health', { accessToken }),
};
