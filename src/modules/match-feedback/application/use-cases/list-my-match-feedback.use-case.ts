import { Inject, Injectable } from '@nestjs/common';
import {
  IMatchFeedbackRepository,
  MATCH_FEEDBACK_REPOSITORY,
  MyMatchFeedbackRecord,
} from '../../domain/repositories/match-feedback.repository.interface';

@Injectable()
export class ListMyMatchFeedbackUseCase {
  constructor(
    @Inject(MATCH_FEEDBACK_REPOSITORY)
    private readonly matchFeedbackRepository: IMatchFeedbackRepository,
  ) {}

  async execute(userId: string): Promise<MyMatchFeedbackRecord[]> {
    return this.matchFeedbackRepository.listByUser(userId);
  }
}
