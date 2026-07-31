import { Entity, EducationLevel } from '@app/shared-kernel';
import { ApplicationWindow } from '../value-objects/application-window.vo';
import { JobPostingFingerprint } from '../value-objects/job-posting-fingerprint.vo';

// EducationLevel artık @app/shared-kernel'de tanımlı (kullanıcı profiliyle ortak sözlük
// olduğu için) — buradan yeniden dışa aktarılır ki mevcut import yolları bozulmasın.
export { EducationLevel };

export enum JobPostingStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
  PENDING_REVIEW = 'PENDING_REVIEW',
}

export enum InstitutionType {
  BAKANLIK = 'BAKANLIK',
  BELEDIYE = 'BELEDIYE',
  UNIVERSITE = 'UNIVERSITE',
  VALILIK = 'VALILIK',
  IL_MUDURLUGU = 'IL_MUDURLUGU',
  KAYMAKAMLIK = 'KAYMAKAMLIK',
  DIGER = 'DIGER',
}

export enum EmploymentType {
  SUREKLI_ISCI = 'SUREKLI_ISCI',
  MEMUR = 'MEMUR',
  SOZLESMELI_PERSONEL = 'SOZLESMELI_PERSONEL',
  GECICI_PERSONEL = 'GECICI_PERSONEL',
}

export interface QualificationCode {
  code: string;
  description: string | null;
}

export interface JobPostingProps {
  sourceId: string;
  externalRef: string | null;
  fingerprint: JobPostingFingerprint;
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
  applicationWindow: ApplicationWindow;
  applicationUrl: string | null;
  description: string | null;
  /**
   * Kaynağın yayınladığı ilan PDF'inin obje deposundaki (MinIO) anahtarı — varsa
   * kullanıcıya "İlan Metni (PDF)" olarak sunulur. Son başvuru tarihi geçince
   * temizlik işi tarafından silinir ve bu alan null'a çekilir.
   */
  pdfStorageKey: string | null;
  status: JobPostingStatus;
  qualificationCodes: QualificationCode[];
  departments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class JobPosting extends Entity<string> {
  private constructor(
    id: string,
    private props: JobPostingProps,
  ) {
    super(id);
  }

  static create(
    id: string,
    params: Omit<JobPostingProps, 'fingerprint' | 'status' | 'createdAt' | 'updatedAt'>,
    status: JobPostingStatus = JobPostingStatus.PUBLISHED,
  ): JobPosting {
    const fingerprint = JobPostingFingerprint.compute({
      institutionName: params.institutionName,
      positionTitle: params.positionTitle,
      cityId: params.cityId,
      applicationStartDate: params.applicationWindow.startDate,
    });

    const now = new Date();
    return new JobPosting(id, {
      ...params,
      fingerprint,
      status,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(id: string, props: JobPostingProps): JobPosting {
    return new JobPosting(id, props);
  }

  get snapshot(): JobPostingProps {
    return { ...this.props };
  }

  get status(): JobPostingStatus {
    return this.props.status;
  }

  update(
    changes: Partial<
      Omit<JobPostingProps, 'sourceId' | 'fingerprint' | 'createdAt' | 'updatedAt' | 'status'>
    >,
  ): void {
    const definedChanges = Object.fromEntries(
      Object.entries(changes).filter(([, value]) => value !== undefined),
    );

    this.props = { ...this.props, ...definedChanges, updatedAt: new Date() };

    this.props.fingerprint = JobPostingFingerprint.compute({
      institutionName: this.props.institutionName,
      positionTitle: this.props.positionTitle,
      cityId: this.props.cityId,
      applicationStartDate: this.props.applicationWindow.startDate,
    });
  }

  archive(): void {
    this.props.status = JobPostingStatus.ARCHIVED;
    this.props.updatedAt = new Date();
  }

  expire(): void {
    this.props.status = JobPostingStatus.EXPIRED;
    this.props.updatedAt = new Date();
  }

  setPdfStorageKey(key: string | null): void {
    this.props.pdfStorageKey = key;
    this.props.updatedAt = new Date();
  }

  publish(): void {
    this.props.status = JobPostingStatus.PUBLISHED;
    this.props.updatedAt = new Date();
  }
}
