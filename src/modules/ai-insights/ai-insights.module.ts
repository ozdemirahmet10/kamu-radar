import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { MatchingModule } from '../matching/matching.module';

import { RadarInsightService } from './infrastructure/radar-insight.service';
import { GenerateRadarInsightUseCase } from './application/use-cases/generate-radar-insight.use-case';
import { MeRadarInsightController } from './presentation/controllers/me-radar-insight.controller';

@Module({
  imports: [IdentityModule, MatchingModule],
  controllers: [MeRadarInsightController],
  providers: [RadarInsightService, GenerateRadarInsightUseCase],
})
export class AiInsightsModule {}
