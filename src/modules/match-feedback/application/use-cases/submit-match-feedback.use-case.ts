import { Inject, Injectable } from '@nestjs/common';
import {
  IMatchFeedbackRepository,
  MATCH_FEEDBACK_REPOSITORY,
} from '../../domain/repositories/match-feedback.repository.interface';

@Injectable()
export class SubmitMatchFeedbackUseCase {
  constructor(
    @Inject(MATCH_FEEDBACK_REPOSITORY)
    private readonly matchFeedbackRepository: IMatchFeedbackRepository,
  ) {}

  async execute(
    userId: string,
    jobPostingId: string,
    isAccurate: boolean,
    reason?: string,
  ): Promise<void> {
    await this.matchFeedbackRepository.submit(userId, jobPostingId, isAccurate, reason ?? null);
  }
}
