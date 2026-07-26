import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { JobCatalogModule } from '../job-catalog/job-catalog.module';

import { MATCH_RESULT_REPOSITORY } from './domain/repositories/match-result.repository.interface';
import { PrismaMatchResultRepository } from './infrastructure/prisma-match-result.repository';
import { EligibilityRuleEngine } from './domain/services/eligibility-rule-engine';
import { GetMyMatchesUseCase } from './application/use-cases/get-my-matches.use-case';
import { MeMatchesController } from './presentation/controllers/me-matches.controller';

@Module({
  imports: [IdentityModule, JobCatalogModule],
  controllers: [MeMatchesController],
  providers: [
    { provide: MATCH_RESULT_REPOSITORY, useClass: PrismaMatchResultRepository },
    EligibilityRuleEngine,
    GetMyMatchesUseCase,
  ],
  exports: [GetMyMatchesUseCase, MATCH_RESULT_REPOSITORY],
})
export class MatchingModule {}
