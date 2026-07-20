import { Injectable } from '@nestjs/common';
import { InstitutionType } from '../../../job-catalog/domain/entities/job-posting.entity';

export interface RuleBasedResult {
  institutionType: InstitutionType | null;
}

const INSTITUTION_TYPE_SUFFIXES: Array<[RegExp, InstitutionType]> = [
  [/bakanlığı\s*$/i, InstitutionType.BAKANLIK],
  [/belediyesi\s*$/i, InstitutionType.BELEDIYE],
  [/üniversitesi\s*$/i, InstitutionType.UNIVERSITE],
  [/valiliği\s*$/i, InstitutionType.VALILIK],
  [/il müdürlüğü\s*$/i, InstitutionType.IL_MUDURLUGU],
  [/kaymakamlığı\s*$/i, InstitutionType.KAYMAKAMLIK],
];

/**
 * Ucuz, deterministik ilk geçiş: yalnızca kurum adının son ekinden kurum türünü çıkarır
 * (örn. "... Bakanlığı" -> BAKANLIK). Kontenjan sayısı, ilan türü gibi serbest metne
 * gömülü ve bağlama duyarlı alanlar için basit regex güvenilir değil — gerçek bir
 * crawl testinde LLM'in doğru bulduğu kontenjan sayısını yanlış bir regex eşleşmesi
 * ezmişti, bu yüzden bu alanlar bilinçli olarak LLM'e (ClaudeExtractionService) bırakılır.
 */
@Injectable()
export class RuleBasedExtractor {
  extract(institutionName: string): RuleBasedResult {
    for (const [pattern, type] of INSTITUTION_TYPE_SUFFIXES) {
      if (pattern.test(institutionName.trim())) {
        return { institutionType: type };
      }
    }
    return { institutionType: null };
  }
}
