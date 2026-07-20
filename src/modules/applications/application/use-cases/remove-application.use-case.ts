import { Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';

@Injectable()
export class RemoveApplicationUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
  ) {}

  async execute(userId: string, jobPostingId: string): Promise<void> {
    await this.applicationRepository.remove(userId, jobPostingId);
  }
}
