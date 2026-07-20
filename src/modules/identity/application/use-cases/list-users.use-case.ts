import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  ListUsersResult,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

export interface ListUsersInput {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class ListUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository) {}

  async execute(input: ListUsersInput): Promise<ListUsersResult> {
    return this.userRepository.list({
      keyword: input.keyword,
      page: input.page ?? DEFAULT_PAGE,
      pageSize: input.pageSize ?? DEFAULT_PAGE_SIZE,
    });
  }
}
