import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigService } from '@app/config';
import { JobCatalogModule } from '../job-catalog/job-catalog.module';

import { CRAWL_SOURCE_REPOSITORY } from './domain/repositories/crawl-source.repository.interface';
import { CRAWL_RUN_REPOSITORY } from './domain/repositories/crawl-run.repository.interface';
import { RAW_CONTENT_STORE } from './application/ports/raw-content-store.port';
import { EXTRACTION_SERVICE } from './application/ports/extraction-service.port';
import { SOURCE_ADAPTER_REGISTRY, ISourceAdapter } from './application/ports/source-adapter.port';

import { PrismaCrawlSourceRepository } from './infrastructure/persistence/prisma-crawl-source.repository';
import { PrismaCrawlRunRepository } from './infrastructure/persistence/prisma-crawl-run.repository';
import { MinioRawContentStore } from './infrastructure/storage/minio-raw-content-store';
import { RuleBasedExtractor } from './infrastructure/extraction/rule-based-extractor';
import { ClaudeExtractionService } from './infrastructure/extraction/claude-extraction.service';
import { HybridExtractionService } from './infrastructure/extraction/hybrid-extraction.service';
import { SbbKamuIlanAdapter } from './infrastructure/adapters/sbb-kamu-ilan.adapter';
import { IlanGovTrAdapter } from './infrastructure/adapters/ilan-gov-tr.adapter';
import { CRAWL_QUEUE_NAME } from './infrastructure/queue/crawl-queue.constants';
import { CrawlProcessor } from './infrastructure/queue/crawl.processor';
import { CrawlSchedulerService } from './infrastructure/queue/crawl-scheduler.service';
import { PDF_CLEANUP_QUEUE_NAME } from './infrastructure/queue/pdf-cleanup-queue.constants';
import { PdfCleanupProcessor } from './infrastructure/queue/pdf-cleanup.processor';
import { PdfCleanupSchedulerService } from './infrastructure/queue/pdf-cleanup-scheduler.service';

import { RunCrawlForSourceUseCase } from './application/use-cases/run-crawl-for-source.use-case';
import { GetJobPostingPdfUseCase } from './application/use-cases/get-job-posting-pdf.use-case';
import { CleanupExpiredPdfsUseCase } from './application/use-cases/cleanup-expired-pdfs.use-case';

import { AdminCrawlController } from './presentation/controllers/admin-crawl.controller';
import { AdminSystemHealthController } from './presentation/controllers/admin-system-health.controller';
import { JobPostingPdfController } from './presentation/controllers/job-posting-pdf.controller';

@Module({
  imports: [
    JobCatalogModule,
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        connection: configService.redis,
      }),
    }),
    BullModule.registerQueue({ name: CRAWL_QUEUE_NAME }, { name: PDF_CLEANUP_QUEUE_NAME }),
  ],
  controllers: [AdminCrawlController, AdminSystemHealthController, JobPostingPdfController],
  providers: [
    { provide: CRAWL_SOURCE_REPOSITORY, useClass: PrismaCrawlSourceRepository },
    { provide: CRAWL_RUN_REPOSITORY, useClass: PrismaCrawlRunRepository },
    { provide: RAW_CONTENT_STORE, useClass: MinioRawContentStore },
    { provide: EXTRACTION_SERVICE, useClass: HybridExtractionService },
    RuleBasedExtractor,
    ClaudeExtractionService,
    SbbKamuIlanAdapter,
    IlanGovTrAdapter,
    {
      provide: SOURCE_ADAPTER_REGISTRY,
      useFactory: (sbbAdapter: ISourceAdapter, ilanGovTrAdapter: ISourceAdapter) => {
        const registry = new Map<string, ISourceAdapter>();
        registry.set(sbbAdapter.adapterKey, sbbAdapter);
        registry.set(ilanGovTrAdapter.adapterKey, ilanGovTrAdapter);
        return registry;
      },
      inject: [SbbKamuIlanAdapter, IlanGovTrAdapter],
    },
    RunCrawlForSourceUseCase,
    GetJobPostingPdfUseCase,
    CleanupExpiredPdfsUseCase,
    CrawlProcessor,
    CrawlSchedulerService,
    PdfCleanupProcessor,
    PdfCleanupSchedulerService,
  ],
  exports: [RAW_CONTENT_STORE],
})
export class CrawlerModule {}
