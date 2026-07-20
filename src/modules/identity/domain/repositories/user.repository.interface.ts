import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface ListUsersParams {
  keyword?: string;
  page: number;
  pageSize: number;
}

export interface ListUsersResult {
  items: User[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
  list(params: ListUsersParams): Promise<ListUsersResult>;
}
