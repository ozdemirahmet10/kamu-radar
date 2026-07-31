import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequestUser } from '../../../identity/infrastructure/auth/jwt.strategy';
import {
  GenerateRadarInsightUseCase,
  RadarInsightResult,
} from '../../application/use-cases/generate-radar-insight.use-case';

@ApiTags('me/radar-insight')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/radar-insight')
export class MeRadarInsightController {
  constructor(private readonly generateRadarInsightUseCase: GenerateRadarInsightUseCase) {}

  @Get()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async get(@CurrentUser() user: RequestUser): Promise<RadarInsightResult> {
    return this.generateRadarInsightUseCase.execute(user.userId);
  }
}
