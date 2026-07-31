import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AppConfigService } from '@app/config';

const MODEL = 'claude-haiku-4-5-20251001';
const FALLBACK_INSIGHT =
  'Şu an size özel bir değerlendirme oluşturulamadı, lütfen daha sonra tekrar deneyin.';

@Injectable()
export class RadarInsightService {
  private readonly logger = new Logger(RadarInsightService.name);
  private readonly client: Anthropic;

  constructor(configService: AppConfigService) {
    this.client = new Anthropic({ apiKey: configService.get('ANTHROPIC_API_KEY') });
  }

  async generate(prompt: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text' || !textBlock.text.trim()) {
        return FALLBACK_INSIGHT;
      }
      return textBlock.text.trim();
    } catch (error) {
      this.logger.warn(`Radar AI içgörüsü oluşturulamadı: ${(error as Error).message}`);
      return FALLBACK_INSIGHT;
    }
  }
}
