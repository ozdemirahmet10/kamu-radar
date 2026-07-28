import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { JobCatalogModule } from '../job-catalog/job-catalog.module';

import { MATCH_FEEDBACK_REPOSITORY } from './domain/repositories/match-feedback.repository.interface';
import { PrismaMatchFeedbackRepository } from './infrastructure/prisma-match-feedback.repository';
import { SubmitMatchFeedbackUseCase } from './application/use-cases/submit-match-feedback.use-case';
import { ListMyMatchFeedbackUseCase } from './application/use-cases/list-my-match-feedback.use-case';
import { GetMatchFeedbackOverviewUseCase } from './application/use-cases/get-match-feedback-overview.use-case';
import { MeMatchFeedbackController } from './presentation/controllers/me-match-feedback.controller';
import { AdminMatchFeedbackController } from './presentation/controllers/admin-match-feedback.controller';

@Module({
  imports: [IdentityModule, JobCatalogModule],
  controllers: [MeMatchFeedbackController, AdminMatchFeedbackController],
  providers: [
    { provide: MATCH_FEEDBACK_REPOSITORY, useClass: PrismaMatchFeedbackRepository },
    SubmitMatchFeedbackUseCase,
    ListMyMatchFeedbackUseCase,
    GetMatchFeedbackOverviewUseCase,
  ],
})
export class MatchFeedbackModule {}
