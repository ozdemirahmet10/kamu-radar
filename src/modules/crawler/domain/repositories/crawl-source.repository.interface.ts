export const CRAWL_SOURCE_REPOSITORY = Symbol('CRAWL_SOURCE_REPOSITORY');

export type CrawlStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL';

export interface CrawlSourceRecord {
  id: string;
  name: string;
  baseUrl: string;
  adapterKey: string;
  crawlFrequencyCron: string;
  isActive: boolean;
  lastCrawledAt: Date | null;
  lastStatus: CrawlStatus | null;
}

export interface CreateCrawlSourceParams {
  name: string;
  baseUrl: string;
  adapterKey: string;
  crawlFrequencyCron: string;
  isActive: boolean;
}

export interface UpdateCrawlSourceParams {
  name?: string;
  baseUrl?: string;
  adapterKey?: string;
  crawlFrequencyCron?: string;
  isActive?: boolean;
}

export interface ICrawlSourceRepository {
  findById(id: string): Promise<CrawlSourceRecord | null>;
  findByAdapterKey(adapterKey: string): Promise<CrawlSourceRecord | null>;
  findAllActive(): Promise<CrawlSourceRecord[]>;
  findAll(): Promise<CrawlSourceRecord[]>;
  updateLastCrawlStatus(id: string, status: CrawlStatus, crawledAt: Date): Promise<void>;
  create(params: CreateCrawlSourceParams): Promise<CrawlSourceRecord>;
  update(id: string, params: UpdateCrawlSourceParams): Promise<CrawlSourceRecord>;
}
