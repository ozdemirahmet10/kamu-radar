import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../../job-catalog/domain/repositories/job-posting.repository.interface';
import {
  FAVORITE_REPOSITORY,
  IFavoriteRepository,
} from '../../domain/repositories/favorite.repository.interface';

@Injectable()
export class AddFavoriteUseCase {
  constructor(
    @Inject(FAVORITE_REPOSITORY) private readonly favoriteRepository: IFavoriteRepository,
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
  ) {}

  async execute(userId: string, jobPostingId: string): Promise<void> {
    const jobPosting = await this.jobPostingRepository.findById(jobPostingId);
    if (!jobPosting) {
      throw new NotFoundException('İlan bulunamadı.');
    }
    await this.favoriteRepository.add(userId, jobPostingId);
  }
}
