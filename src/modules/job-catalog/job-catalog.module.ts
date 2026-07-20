import { Module } from '@nestjs/common';

import { JOB_POSTING_REPOSITORY } from './domain/repositories/job-posting.repository.interface';
import { SOURCE_RESOLVER } from './application/ports/source-resolver.port';
import { CITY_RESOLVER } from './application/ports/city-resolver.port';

import { PrismaJobPostingRepository } from './infrastructure/prisma-job-posting.repository';
import { PrismaSourceResolver } from './infrastructure/prisma-source-resolver';
import { PrismaCityResolver } from './infrastructure/prisma-city-resolver';

import { CreateJobPostingUseCase } from './application/use-cases/create-job-posting.use-case';
import { UpdateJobPostingUseCase } from './application/use-cases/update-job-posting.use-case';
import { ArchiveJobPostingUseCase } from './application/use-cases/archive-job-posting.use-case';
import { ApproveJobPostingUseCase } from './application/use-cases/approve-job-posting.use-case';
import { ListJobPostingsUseCase } from './application/use-cases/list-job-postings.use-case';
import { GetJobPostingByIdUseCase } from './application/use-cases/get-job-posting-by-id.use-case';
import { UpsertJobPostingFromCrawlUseCase } from './application/use-cases/upsert-job-posting-from-crawl.use-case';
import { ListInstitutionsUseCase } from './application/use-cases/list-institutions.use-case';

import { JobPostingController } from './presentation/controllers/job-posting.controller';
import { AdminJobPostingController } from './presentation/controllers/admin-job-posting.controller';
import { InstitutionController } from './presentation/controllers/institution.controller';

@Module({
  controllers: [JobPostingController, AdminJobPostingController, InstitutionController],
  providers: [
    { provide: JOB_POSTING_REPOSITORY, useClass: PrismaJobPostingRepository },
    { provide: SOURCE_RESOLVER, useClass: PrismaSourceResolver },
    { provide: CITY_RESOLVER, useClass: PrismaCityResolver },
    CreateJobPostingUseCase,
    UpdateJobPostingUseCase,
    ArchiveJobPostingUseCase,
    ApproveJobPostingUseCase,
    ListJobPostingsUseCase,
    GetJobPostingByIdUseCase,
    UpsertJobPostingFromCrawlUseCase,
    ListInstitutionsUseCase,
  ],
  exports: [UpsertJobPostingFromCrawlUseCase, JOB_POSTING_REPOSITORY],
})
export class JobCatalogModule {}
