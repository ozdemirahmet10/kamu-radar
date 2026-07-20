import { Inject, Injectable } from '@nestjs/common';
import {
  FAVORITE_REPOSITORY,
  IFavoriteRepository,
} from '../../domain/repositories/favorite.repository.interface';

@Injectable()
export class RemoveFavoriteUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY) private readonly favoriteRepository: IFavoriteRepository,
  ) {}

  async execute(userId: string, jobPostingId: string): Promise<void> {
    await this.favoriteRepository.remove(userId, jobPostingId);
  }
}
