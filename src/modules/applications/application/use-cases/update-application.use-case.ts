import { Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
  UpdateApplicationChanges,
} from '../../domain/repositories/application.repository.interface';

@Injectable()
export class UpdateApplicationUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
  ) {}

  async execute(
    userId: string,
    jobPostingId: string,
    changes: UpdateApplicationChanges,
  ): Promise<void> {
    await this.applicationRepository.update(userId, jobPostingId, changes);
  }
}
