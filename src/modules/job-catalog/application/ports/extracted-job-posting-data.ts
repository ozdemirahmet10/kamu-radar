import {
  EducationLevel,
  EmploymentType,
  InstitutionType,
  QualificationCode,
} from '../../domain/entities/job-posting.entity';

/**
 * Crawler/parsing hattının (kural tabanlı veya LLM ile) bir ilan metninden çıkardığı,
 * henüz veritabanına yazılmamış normalize edilmiş veri. Kaynak ne olursa olsun
 * (ÖSYM, belediye sitesi, PDF vb.) bu sabit şekle indirgenir.
 */
export interface ExtractedJobPostingData {
  institutionName: string;
  institutionType: InstitutionType | null;
  positionTitle: string;
  cityName: string | null;
  quotaCount: number | null;
  employmentType: EmploymentType | null;
  minimumEducationLevel: EducationLevel | null;
  kpssScoreType: string | null;
  minKpssScore: number | null;
  minAge: number | null;
  maxAge: number | null;
  requiresExperience: boolean;
  applicationStartDate: Date | null;
  applicationEndDate: Date | null;
  applicationUrl: string | null;
  description: string | null;
  qualificationCodes: QualificationCode[];
  departments: string[];
  /** 0-1 aralığında; çıkarımın ne kadar güvenilir olduğu (rule-based: 1, LLM: model tahmini) */
  confidence: number;
}
