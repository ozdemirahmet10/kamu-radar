import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { JobCatalogModule } from '../job-catalog/job-catalog.module';
import { EligibilityRuleEngine } from '../matching/domain/services/eligibility-rule-engine';

import { FAVORITE_REPOSITORY } from './domain/repositories/favorite.repository.interface';
import { PrismaFavoriteRepository } from './infrastructure/prisma-favorite.repository';
import { AddFavoriteUseCase } from './application/use-cases/add-favorite.use-case';
import { RemoveFavoriteUseCase } from './application/use-cases/remove-favorite.use-case';
import { ListMyFavoritesUseCase } from './application/use-cases/list-my-favorites.use-case';
import { MeFavoritesController } from './presentation/controllers/me-favorites.controller';

@Module({
  imports: [IdentityModule, JobCatalogModule],
  controllers: [MeFavoritesController],
  providers: [
    { provide: FAVORITE_REPOSITORY, useClass: PrismaFavoriteRepository },
    EligibilityRuleEngine,
    AddFavoriteUseCase,
    RemoveFavoriteUseCase,
    ListMyFavoritesUseCase,
  ],
})
export class FavoritesModule {}
