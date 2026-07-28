import { Inject, Injectable } from '@nestjs/common';
import {
  IMatchFeedbackRepository,
  MATCH_FEEDBACK_REPOSITORY,
  MatchFeedbackRecord,
  MatchFeedbackStats,
} from '../../domain/repositories/match-feedback.repository.interface';

const RECENT_FEEDBACK_LIMIT = 20;

export interface MatchFeedbackOverview {
  stats: MatchFeedbackStats;
  recent: MatchFeedbackRecord[];
}

@Injectable()
export class GetMatchFeedbackOverviewUseCase {
  constructor(
    @Inject(MATCH_FEEDBACK_REPOSITORY)
    private readonly matchFeedbackRepository: IMatchFeedbackRepository,
  ) {}

  async execute(): Promise<MatchFeedbackOverview> {
    const [stats, recent] = await Promise.all([
      this.matchFeedbackRepository.getStats(),
      this.matchFeedbackRepository.listRecent(RECENT_FEEDBACK_LIMIT),
    ]);
    return { stats, recent };
  }
}
