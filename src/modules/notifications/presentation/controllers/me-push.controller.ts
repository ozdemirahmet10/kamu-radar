import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequestUser } from '../../../identity/infrastructure/auth/jwt.strategy';
import { SubscribePushUseCase } from '../../application/use-cases/subscribe-push.use-case';
import { UnsubscribePushUseCase } from '../../application/use-cases/unsubscribe-push.use-case';
import { SubscribePushDto, UnsubscribePushDto } from '../../application/dto/subscribe-push.dto';

@ApiTags('me/push')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/push')
export class MePushController {
  constructor(
    private readonly subscribePushUseCase: SubscribePushUseCase,
    private readonly unsubscribePushUseCase: UnsubscribePushUseCase,
  ) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async subscribe(@CurrentUser() user: RequestUser, @Body() dto: SubscribePushDto): Promise<void> {
    await this.subscribePushUseCase.execute(user.userId, {
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
    });
  }

  @Delete('subscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(
    @CurrentUser() user: RequestUser,
    @Body() dto: UnsubscribePushDto,
  ): Promise<void> {
    await this.unsubscribePushUseCase.execute(user.userId, dto.endpoint);
  }
}
