import { EligibilityStatus } from '../entities/eligibility-result';

export const MATCH_RESULT_REPOSITORY = Symbol('MATCH_RESULT_REPOSITORY');

export interface IMatchResultRepository {
  /** Hesaplanan uygunluk sonucunu kalıcı kayıt/denetim izi olarak saklar (upsert). */
  upsert(
    userId: string,
    jobPostingId: string,
    status: EligibilityStatus,
    missingCriteria: string[],
  ): Promise<void>;
}
