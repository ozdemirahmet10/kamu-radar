import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequestUser } from '../../../identity/infrastructure/auth/jwt.strategy';
import { SubmitSupportRequestUseCase } from '../../application/use-cases/submit-support-request.use-case';
import { SubmitSupportRequestDto } from '../../application/dto/submit-support-request.dto';

@ApiTags('me/support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/support-requests')
export class MeSupportController {
  constructor(private readonly submitSupportRequestUseCase: SubmitSupportRequestUseCase) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async submit(
    @CurrentUser() user: RequestUser,
    @Body() dto: SubmitSupportRequestDto,
  ): Promise<void> {
    await this.submitSupportRequestUseCase.execute(user.userId, dto.type, dto.message);
  }
}
