import { Injectable } from '@nestjs/common';
import { ExtractedJobPostingData } from '../../../job-catalog/application/ports/extracted-job-posting-data';
import { IExtractionService } from '../../application/ports/extraction-service.port';
import { RuleBasedExtractor } from './rule-based-extractor';
import { ClaudeExtractionService } from './claude-extraction.service';

/**
 * KPSS puanı, kontenjan, şehir gibi serbest metne gömülü ve bağlama duyarlı alanlar
 * için her zaman LLM'e başvurur. Kural tabanlı çıkarım yalnızca kurum adının son
 * ekinden %100 deterministik çıkarılabilen kurum türünü (BAKANLIK/BELEDİYE vb.)
 * doldurur — LLM bu konuda emin değilse (null dönerse) devreye girer.
 */
@Injectable()
export class HybridExtractionService implements IExtractionService {
  constructor(
    private readonly ruleBasedExtractor: RuleBasedExtractor,
    private readonly claudeExtractionService: ClaudeExtractionService,
  ) {}

  async extract(rawText: string, referenceDate: Date): Promise<ExtractedJobPostingData> {
    const llmResult = await this.claudeExtractionService.extract(rawText, referenceDate);
    const ruleBasedResult = this.ruleBasedExtractor.extract(llmResult.institutionName);

    return {
      ...llmResult,
      institutionType: llmResult.institutionType ?? ruleBasedResult.institutionType,
    };
  }
}
