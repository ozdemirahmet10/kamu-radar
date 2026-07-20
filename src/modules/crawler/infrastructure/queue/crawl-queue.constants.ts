export const CRAWL_QUEUE_NAME = 'crawl-queue';
export const CRAWL_JOB_NAME = 'run-crawl';

export interface CrawlJobData {
  sourceId: string;
  maxItems?: number;
}
