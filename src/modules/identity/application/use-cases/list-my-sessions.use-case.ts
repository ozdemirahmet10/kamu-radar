import { Inject, Injectable } from '@nestjs/common';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
  StoredRefreshToken,
} from '../../domain/repositories/refresh-token.repository.interface';

@Injectable()
export class ListMySessionsUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(userId: string): Promise<StoredRefreshToken[]> {
    return this.refreshTokenRepository.listActiveForUser(userId, new Date());
  }
}
