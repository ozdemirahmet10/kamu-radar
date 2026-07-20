import { ApplicationStatus } from '../entities/application-status';

export const APPLICATION_REPOSITORY = Symbol('APPLICATION_REPOSITORY');

export { ApplicationStatus };

export interface ApplicationRecord {
  id: string;
  jobPostingId: string;
  status: ApplicationStatus;
  note: string | null;
  nextActionLabel: string | null;
  nextActionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateApplicationChanges {
  status?: ApplicationStatus;
  note?: string | null;
  nextActionLabel?: string | null;
  nextActionDate?: Date | null;
}

export interface IApplicationRepository {
  add(userId: string, jobPostingId: string): Promise<void>;
  remove(userId: string, jobPostingId: string): Promise<void>;
  update(userId: string, jobPostingId: string, changes: UpdateApplicationChanges): Promise<void>;
  listByUser(userId: string): Promise<ApplicationRecord[]>;
  listJobPostingIdsByUser(userId: string): Promise<string[]>;
}
