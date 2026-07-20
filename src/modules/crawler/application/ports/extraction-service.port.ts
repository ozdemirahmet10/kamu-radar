import { ExtractedJobPostingData } from '../../../job-catalog/application/ports/extracted-job-posting-data';

export const EXTRACTION_SERVICE = Symbol('EXTRACTION_SERVICE');

export interface IExtractionService {
  extract(rawText: string, referenceDate: Date): Promise<ExtractedJobPostingData>;
}
