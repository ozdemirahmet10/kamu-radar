export const INSTITUTION_FOLLOW_REPOSITORY = Symbol('INSTITUTION_FOLLOW_REPOSITORY');

export interface InstitutionFollowRecord {
  institutionName: string;
  createdAt: Date;
}

export interface IInstitutionFollowRepository {
  follow(userId: string, institutionName: string): Promise<void>;
  unfollow(userId: string, institutionName: string): Promise<void>;
  listByUser(userId: string): Promise<InstitutionFollowRecord[]>;
  listInstitutionNamesByUser(userId: string): Promise<string[]>;
}
