import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { JobCatalogModule } from '../job-catalog/job-catalog.module';

import { APPLICATION_REPOSITORY } from './domain/repositories/application.repository.interface';
import { PrismaApplicationRepository } from './infrastructure/prisma-application.repository';
import { AddApplicationUseCase } from './application/use-cases/add-application.use-case';
import { RemoveApplicationUseCase } from './application/use-cases/remove-application.use-case';
import { UpdateApplicationUseCase } from './application/use-cases/update-application.use-case';
import { ListMyApplicationsUseCase } from './application/use-cases/list-my-applications.use-case';
import { MeApplicationsController } from './presentation/controllers/me-applications.controller';

@Module({
  imports: [IdentityModule, JobCatalogModule],
  controllers: [MeApplicationsController],
  providers: [
    { provide: APPLICATION_REPOSITORY, useClass: PrismaApplicationRepository },
    AddApplicationUseCase,
    RemoveApplicationUseCase,
    UpdateApplicationUseCase,
    ListMyApplicationsUseCase,
  ],
  exports: [APPLICATION_REPOSITORY],
})
export class ApplicationsModule {}
