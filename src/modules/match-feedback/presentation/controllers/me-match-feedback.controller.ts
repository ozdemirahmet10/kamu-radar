import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequestUser } from '../../../identity/infrastructure/auth/jwt.strategy';
import { SubmitMatchFeedbackUseCase } from '../../application/use-cases/submit-match-feedback.use-case';
import { SubmitMatchFeedbackDto } from '../../application/dto/submit-match-feedback.dto';

@ApiTags('me/match-feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/matches')
export class MeMatchFeedbackController {
  constructor(private readonly submitMatchFeedbackUseCase: SubmitMatchFeedbackUseCase) {}

  @Post(':jobPostingId/feedback')
  @HttpCode(HttpStatus.NO_CONTENT)
  async submitFeedback(
    @CurrentUser() user: RequestUser,
    @Param('jobPostingId') jobPostingId: string,
    @Body() dto: SubmitMatchFeedbackDto,
  ): Promise<void> {
    await this.submitMatchFeedbackUseCase.execute(
      user.userId,
      jobPostingId,
      dto.isAccurate,
      dto.reason,
    );
  }
}
