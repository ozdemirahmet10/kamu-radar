import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  CRAWL_SOURCE_REPOSITORY,
  ICrawlSourceRepository,
} from '../../domain/repositories/crawl-source.repository.interface';
import {
  CRAWL_RUN_REPOSITORY,
  ICrawlRunRepository,
} from '../../domain/repositories/crawl-run.repository.interface';
import { SOURCE_ADAPTER_REGISTRY, SourceAdapterRegistry } from '../ports/source-adapter.port';
import { RAW_CONTENT_STORE, IRawContentStore } from '../ports/raw-content-store.port';
import { EXTRACTION_SERVICE, IExtractionService } from '../ports/extraction-service.port';
import { UpsertJobPostingFromCrawlUseCase } from '../../../job-catalog/application/use-cases/upsert-job-posting-from-crawl.use-case';
import {
  JOB_POSTING_REPOSITORY,
  IJobPostingRepository,
} from '../../../job-catalog/domain/repositories/job-posting.repository.interface';

export interface RunCrawlForSourceResult {
  itemsFound: number;
  itemsNew: number;
  itemsSkipped: number;
  itemsFailed: number;
  itemsPdfBackfilled: number;
}

const REQUEST_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class RunCrawlForSourceUseCase {
  private readonly logger = new Logger(RunCrawlForSourceUseCase.name);

  constructor(
    @Inject(CRAWL_SOURCE_REPOSITORY) private readonly crawlSourceRepository: ICrawlSourceRepository,
    @Inject(CRAWL_RUN_REPOSITORY) private readonly crawlRunRepository: ICrawlRunRepository,
    @Inject(SOURCE_ADAPTER_REGISTRY) private readonly adapterRegistry: SourceAdapterRegistry,
    @Inject(RAW_CONTENT_STORE) private readonly rawContentStore: IRawContentStore,
    @Inject(EXTRACTION_SERVICE) private readonly extractionService: IExtractionService,
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
    private readonly upsertJobPostingFromCrawlUseCase: UpsertJobPostingFromCrawlUseCase,
  ) {}

  async execute(sourceId: string, maxItems?: number): Promise<RunCrawlForSourceResult> {
    const source = await this.crawlSourceRepository.findById(sourceId);
    if (!source) {
      throw new NotFoundException('Kaynak bulunamadı');
    }

    const adapter = this.adapterRegistry.get(source.adapterKey);
    if (!adapter) {
      throw new NotFoundException(`'${source.adapterKey}' için bir adapter kayıtlı değil`);
    }

    const runId = await this.crawlRunRepository.start(sourceId);
    let itemsNew = 0;
    let itemsSkipped = 0;
    let itemsFailed = 0;
    let itemsPdfBackfilled = 0;
    let listingsCount = 0;

    try {
      const summaries = await adapter.fetchListingSummaries(maxItems);
      listingsCount = summaries.length;

      for (const summary of summaries) {
        const alreadyKnown = await this.jobPostingRepository.findBySourceAndExternalRef(
          sourceId,
          summary.externalRef,
        );

        if (alreadyKnown) {
          itemsSkipped += 1;

          // Bu ilan bize daha önce yayınlanan PDF özelliğinden önce eklenmiş olabilir
          // (ya da o zamanki PDF indirme denemesi başarısız olmuş olabilir). Ana metin
          // çıkarımını tekrar yapmaya gerek yok, ama arşivlenmiş PDF'i eksikse ve ilan
          // hâlâ kaynağın canlı listesinde görünüyorsa (yani detay linki hâlâ geçerliyse),
          // sadece PDF'i tamamlamayı dene.
          if (!alreadyKnown.snapshot.pdfStorageKey) {
            try {
              const { pdfBuffer } = await adapter.fetchDetailText(summary);
              if (pdfBuffer) {
                const pdfStorageKey = `${source.adapterKey}/${summary.externalRef}.pdf`;
                await this.rawContentStore.store(pdfStorageKey, pdfBuffer, 'application/pdf');
                alreadyKnown.setPdfStorageKey(pdfStorageKey);
                await this.jobPostingRepository.save(alreadyKnown, 'PDF geriye dönük tamamlama');
                itemsPdfBackfilled += 1;
              }
            } catch (error) {
              this.logger.warn(
                `PDF geriye dönük tamamlanamadı (${summary.institutionName}): ${(error as Error).message}`,
              );
            }
            await sleep(REQUEST_DELAY_MS);
          }

          continue;
        }

        try {
          const { text: rawText, pdfBuffer } = await adapter.fetchDetailText(summary);

          const rawKey = `${source.adapterKey}/${summary.externalRef}.txt`;
          await this.rawContentStore.store(rawKey, rawText);

          // Kaynağın yayınladığı orijinal ilan PDF'i varsa, kullanıcıya "İlan Metni (PDF)"
          // olarak sunulabilmesi için ayrıca arşivlenir (son başvuru tarihi geçince
          // temizlik işi tarafından silinir — bkz. CleanupExpiredPdfsUseCase).
          let pdfStorageKey: string | null = null;
          if (pdfBuffer) {
            pdfStorageKey = `${source.adapterKey}/${summary.externalRef}.pdf`;
            await this.rawContentStore.store(pdfStorageKey, pdfBuffer, 'application/pdf');
          }

          const extracted = await this.extractionService.extract(rawText, new Date());
          // summary.sourceUrl bazı kaynaklarda oturuma bağlı/rotasyonlu bir token içerebilir
          // (bkz. ListingSummary.sourceUrl notu) — kullanıcıya gösterilecek link için kaynağın
          // kendi bildirdiği kalıcı stablePublicUrl kullanılır, yoksa link boş bırakılır.
          extracted.applicationUrl = extracted.applicationUrl ?? summary.stablePublicUrl;

          const result = await this.upsertJobPostingFromCrawlUseCase.execute(
            sourceId,
            summary.externalRef,
            extracted,
            pdfStorageKey,
          );
          if (result.wasCreated) {
            itemsNew += 1;
          } else {
            itemsSkipped += 1;
            this.logger.warn(
              `'${summary.institutionName}' externalRef ile bilinmiyordu ama fingerprint eşleşti ` +
                '(muhtemelen liste metni hafif değişti) — mevcut kayıt güncellendi, yeni kayıt açılmadı.',
            );
          }
        } catch (error) {
          itemsFailed += 1;
          this.logger.warn(
            `İlan işlenemedi (${summary.institutionName}): ${(error as Error).message}`,
          );
        }

        await sleep(REQUEST_DELAY_MS);
      }

      const status =
        itemsFailed === 0 ? 'SUCCESS' : itemsFailed < listingsCount ? 'PARTIAL' : 'FAILED';
      await this.crawlRunRepository.complete(runId, {
        status,
        itemsFound: listingsCount,
        itemsNew,
      });
      await this.crawlSourceRepository.updateLastCrawlStatus(sourceId, status, new Date());
    } catch (error) {
      await this.crawlRunRepository.complete(runId, {
        status: 'FAILED',
        itemsFound: listingsCount,
        itemsNew,
        errorMessage: (error as Error).message,
      });
      await this.crawlSourceRepository.updateLastCrawlStatus(sourceId, 'FAILED', new Date());
      throw error;
    }

    return { itemsFound: listingsCount, itemsNew, itemsSkipped, itemsFailed, itemsPdfBackfilled };
  }
}
