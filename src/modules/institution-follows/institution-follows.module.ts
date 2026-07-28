import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';

import { INSTITUTION_FOLLOW_REPOSITORY } from './domain/repositories/institution-follow.repository.interface';
import { PrismaInstitutionFollowRepository } from './infrastructure/prisma-institution-follow.repository';
import { FollowInstitutionUseCase } from './application/use-cases/follow-institution.use-case';
import { UnfollowInstitutionUseCase } from './application/use-cases/unfollow-institution.use-case';
import { ListMyFollowedInstitutionsUseCase } from './application/use-cases/list-my-followed-institutions.use-case';
import { MeInstitutionFollowsController } from './presentation/controllers/me-institution-follows.controller';

@Module({
  imports: [IdentityModule],
  controllers: [MeInstitutionFollowsController],
  providers: [
    { provide: INSTITUTION_FOLLOW_REPOSITORY, useClass: PrismaInstitutionFollowRepository },
    FollowInstitutionUseCase,
    UnfollowInstitutionUseCase,
    ListMyFollowedInstitutionsUseCase,
  ],
  exports: [INSTITUTION_FOLLOW_REPOSITORY],
})
export class InstitutionFollowsModule {}
