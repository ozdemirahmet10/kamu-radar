import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AppConfigService } from '@app/config';
import {
  EducationLevel,
  EmploymentType,
  InstitutionType,
} from '../../../job-catalog/domain/entities/job-posting.entity';
import { ExtractedJobPostingData } from '../../../job-catalog/application/ports/extracted-job-posting-data';
import { IExtractionService } from '../../application/ports/extraction-service.port';

const MODEL = 'claude-haiku-4-5-20251001';

const EXTRACTION_TOOL = {
  name: 'extract_job_posting',
  description: 'Bir Türkçe kamu personeli alım ilanı metninden yapılandırılmış alanları çıkarır.',
  input_schema: {
    type: 'object' as const,
    properties: {
      institutionName: { type: 'string' },
      institutionType: {
        type: ['string', 'null'],
        enum: [...Object.values(InstitutionType), null],
      },
      positionTitle: { type: 'string', description: 'Kadro/pozisyon unvanı, örn. "Sürekli İşçi"' },
      cityName: { type: ['string', 'null'], description: 'İlin adı, belirtilmemişse null' },
      quotaCount: { type: ['number', 'null'] },
      employmentType: {
        type: ['string', 'null'],
        enum: [...Object.values(EmploymentType), null],
      },
      minimumEducationLevel: {
        type: ['string', 'null'],
        enum: [...Object.values(EducationLevel), null],
      },
      kpssScoreType: { type: ['string', 'null'], description: 'örn. "P3", "P94"' },
      minKpssScore: { type: ['number', 'null'] },
      minAge: { type: ['number', 'null'] },
      maxAge: { type: ['number', 'null'] },
      requiresExperience: { type: 'boolean' },
      applicationStartDate: { type: ['string', 'null'], description: 'ISO 8601 tarih' },
      applicationEndDate: { type: ['string', 'null'], description: 'ISO 8601 tarih' },
      description: { type: ['string', 'null'], description: 'Kısa genel açıklama, 2-3 cümle' },
      qualificationCodes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            description: { type: ['string', 'null'] },
          },
          required: ['code'],
        },
      },
      departments: { type: 'array', items: { type: 'string' } },
      confidence: {
        type: 'number',
        description:
          'Bu çıkarımın ne kadar güvenilir olduğu (0-1). Metin belirsizse veya çoğu alan bulunamadıysa düşük ver.',
      },
    },
    required: [
      'institutionName',
      'positionTitle',
      'requiresExperience',
      'qualificationCodes',
      'departments',
      'confidence',
    ],
  },
};

interface ExtractionToolInput {
  institutionName: string;
  institutionType: InstitutionType | null;
  positionTitle: string;
  cityName: string | null;
  quotaCount: number | null;
  employmentType: EmploymentType | null;
  minimumEducationLevel: EducationLevel | null;
  kpssScoreType: string | null;
  minKpssScore: number | null;
  minAge: number | null;
  maxAge: number | null;
  requiresExperience: boolean;
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  description: string | null;
  qualificationCodes: { code: string; description: string | null }[];
  departments: string[];
  confidence: number;
}

@Injectable()
export class ClaudeExtractionService implements IExtractionService {
  private readonly logger = new Logger(ClaudeExtractionService.name);
  private readonly client: Anthropic;

  constructor(configService: AppConfigService) {
    this.client = new Anthropic({ apiKey: configService.get('ANTHROPIC_API_KEY') });
  }

  async extract(rawText: string, referenceDate: Date): Promise<ExtractedJobPostingData> {
    const truncated = rawText.slice(0, 12000);

    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: 'tool', name: 'extract_job_posting' },
      messages: [
        {
          role: 'user',
          content:
            `Bugünün tarihi: ${referenceDate.toISOString().slice(0, 10)}. ` +
            `Aşağıdaki Türkçe kamu personeli alım ilanı metninden alanları çıkar. ` +
            `Tarih aralıkları yıl belirtmeden verilmişse (örn. "13 Temmuz - 17 Temmuz"), bugünün tarihine göre en makul yılı kullan. ` +
            `Bulamadığın alanlar için null kullan, tahmin uydurma.\n\n---\n${truncated}`,
        },
      ],
    });

    const toolUse = response.content.find((block) => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      this.logger.warn('LLM tool_use çıktısı alınamadı, boş sonuç dönülüyor');
      return this.emptyResult();
    }

    const input = toolUse.input as ExtractionToolInput;
    return {
      institutionName: input.institutionName,
      institutionType: input.institutionType,
      positionTitle: input.positionTitle,
      cityName: input.cityName,
      quotaCount: input.quotaCount,
      employmentType: input.employmentType,
      minimumEducationLevel: this.normalizeEducationLevel(input.minimumEducationLevel),
      kpssScoreType: input.kpssScoreType,
      minKpssScore: input.minKpssScore,
      minAge: input.minAge,
      maxAge: input.maxAge,
      requiresExperience: input.requiresExperience,
      applicationStartDate: input.applicationStartDate
        ? new Date(input.applicationStartDate)
        : null,
      applicationEndDate: input.applicationEndDate ? new Date(input.applicationEndDate) : null,
      applicationUrl: null,
      description: input.description,
      qualificationCodes: input.qualificationCodes ?? [],
      departments: input.departments ?? [],
      confidence: Math.max(0, Math.min(1, input.confidence ?? 0.5)),
    };
  }

  /**
   * Tool-use JSON şemasındaki `enum` kısıtlaması modele güçlü bir yönlendirme sağlar
   * ama %100 garanti değildir — modelin arada bir şemada olmayan bir eş anlamlı
   * (örn. "ORTAOGRETIM") üretmesi, aşağı akışta Prisma enum hatasıyla tüm ilanın
   * işlenmesini durdurabiliyordu (bkz. ilan.gov.tr kaynağı ile canlıda yaşanan hata).
   * Bilinen eş anlamlıları normalize ediyor, tanınmayan her şeyi güvenli şekilde null'a düşürüyoruz.
   */
  private normalizeEducationLevel(
    value: EducationLevel | string | null | undefined,
  ): EducationLevel | null {
    if (value == null) return null;
    if (Object.values(EducationLevel).includes(value as EducationLevel)) {
      return value as EducationLevel;
    }
    const synonyms: Record<string, EducationLevel> = {
      ORTAOGRETIM: EducationLevel.LISE,
      ORTAOKUL: EducationLevel.ILKOGRETIM,
      ILKOKUL: EducationLevel.ILKOGRETIM,
      ONLISANS: EducationLevel.ON_LISANS,
      YUKSEKLISANS: EducationLevel.YUKSEK_LISANS,
      DOKTORA: EducationLevel.YUKSEK_LISANS,
    };
    const normalized = synonyms[value.toUpperCase().replace(/[^A-Z]/g, '')];
    if (!normalized) {
      this.logger.warn(`Bilinmeyen öğrenim seviyesi değeri LLM'den geldi, null'a düşürülüyor: "${value}"`);
    }
    return normalized ?? null;
  }

  private emptyResult(): ExtractedJobPostingData {
    return {
      institutionName: '',
      institutionType: null,
      positionTitle: '',
      cityName: null,
      quotaCount: null,
      employmentType: null,
      minimumEducationLevel: null,
      kpssScoreType: null,
      minKpssScore: null,
      minAge: null,
      maxAge: null,
      requiresExperience: false,
      applicationStartDate: null,
      applicationEndDate: null,
      applicationUrl: null,
      description: null,
      qualificationCodes: [],
      departments: [],
      confidence: 0,
    };
  }
}
