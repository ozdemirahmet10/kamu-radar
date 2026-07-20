import { CrawlStatus } from './crawl-source.repository.interface';

export const CRAWL_RUN_REPOSITORY = Symbol('CRAWL_RUN_REPOSITORY');

export interface CrawlRunRecord {
  id: string;
  sourceId: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: CrawlStatus;
  itemsFound: number;
  itemsNew: number;
  errorMessage: string | null;
}

export interface ICrawlRunRepository {
  start(sourceId: string): Promise<string>;
  complete(
    id: string,
    result: { status: CrawlStatus; itemsFound: number; itemsNew: number; errorMessage?: string },
  ): Promise<void>;
  findRecentBySourceId(sourceId: string, limit: number): Promise<CrawlRunRecord[]>;
  findAll(limit: number): Promise<CrawlRunRecord[]>;
}
