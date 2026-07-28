export const MATCH_FEEDBACK_REPOSITORY = Symbol('MATCH_FEEDBACK_REPOSITORY');

export interface MatchFeedbackRecord {
  id: string;
  jobPostingId: string;
  isAccurate: boolean;
  reason: string | null;
  createdAt: Date;
}

export interface MatchFeedbackStats {
  accurate: number;
  inaccurate: number;
}

export interface MyMatchFeedbackRecord {
  jobPostingId: string;
  isAccurate: boolean;
}

export interface IMatchFeedbackRepository {
  submit(
    userId: string,
    jobPostingId: string,
    isAccurate: boolean,
    reason: string | null,
  ): Promise<void>;
  getStats(): Promise<MatchFeedbackStats>;
  listRecent(limit: number): Promise<MatchFeedbackRecord[]>;
  /** Kullanıcının kendi verdiği geri bildirimler — sayfa yeniden yüklendiğinde ikonların doğru durumu göstermesi için. */
  listByUser(userId: string): Promise<MyMatchFeedbackRecord[]>;
}
