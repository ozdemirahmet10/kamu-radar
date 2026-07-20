export const FAVORITE_REPOSITORY = Symbol('FAVORITE_REPOSITORY');

export interface FavoriteRecord {
  jobPostingId: string;
  createdAt: Date;
}

export interface IFavoriteRepository {
  add(userId: string, jobPostingId: string): Promise<void>;
  remove(userId: string, jobPostingId: string): Promise<void>;
  listJobPostingIdsByUser(userId: string): Promise<string[]>;
  listByUser(userId: string): Promise<FavoriteRecord[]>;
}
