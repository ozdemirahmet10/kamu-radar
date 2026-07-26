import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequestUser } from '../../../identity/infrastructure/auth/jwt.strategy';
import { ListMyNotificationsUseCase } from '../../application/use-cases/list-my-notifications.use-case';
import { MarkNotificationReadUseCase } from '../../application/use-cases/mark-notification-read.use-case';
import { MarkAllNotificationsReadUseCase } from '../../application/use-cases/mark-all-notifications-read.use-case';
import { GetUnreadNotificationCountUseCase } from '../../application/use-cases/get-unread-notification-count.use-case';
import { GetNotificationPreferenceUseCase } from '../../application/use-cases/get-notification-preference.use-case';
import { UpdateNotificationPreferenceUseCase } from '../../application/use-cases/update-notification-preference.use-case';
import { ListMyNotificationsQueryDto } from '../../application/dto/list-my-notifications-query.dto';
import { UpdateNotificationPreferenceDto } from '../../application/dto/update-notification-preference.dto';
import { DigestFrequency } from '../../domain/repositories/notification-preference.repository.interface';

@ApiTags('me/notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/notifications')
export class MeNotificationsController {
  constructor(
    private readonly listMyNotificationsUseCase: ListMyNotificationsUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
    private readonly getUnreadNotificationCountUseCase: GetUnreadNotificationCountUseCase,
    private readonly getNotificationPreferenceUseCase: GetNotificationPreferenceUseCase,
    private readonly updateNotificationPreferenceUseCase: UpdateNotificationPreferenceUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: RequestUser, @Query() query: ListMyNotificationsQueryDto) {
    return this.listMyNotificationsUseCase.execute({
      userId: user.userId,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
    });
  }

  /**
   * Topbar/sidebar rozeti için — kullanıcı Bildirimler sayfasını hiç açmamış olsa
   * bile yeni oluşan bildirim adaylarının kaçırılmaması için burada da senkronizasyon
   * çalıştırılır (list() ile aynı senkronizasyon, sadece dönen veri sayıdan ibaret).
   */
  @Get('unread-count')
  async unreadCount(@CurrentUser() user: RequestUser): Promise<{ count: number }> {
    const count = await this.getUnreadNotificationCountUseCase.execute(user.userId);
    return { count };
  }

  @Patch(':id/read')
  async markRead(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<void> {
    await this.markNotificationReadUseCase.execute(user.userId, id);
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: RequestUser): Promise<void> {
    await this.markAllNotificationsReadUseCase.execute(user.userId);
  }

  @Get('preference')
  async getPreference(
    @CurrentUser() user: RequestUser,
  ): Promise<{ inAppEnabled: boolean; emailEnabled: boolean; emailDigestFrequency: DigestFrequency }> {
    return this.getNotificationPreferenceUseCase.execute(user.userId);
  }

  @Patch('preference')
  async updatePreference(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateNotificationPreferenceDto,
  ): Promise<void> {
    await this.updateNotificationPreferenceUseCase.execute(user.userId, {
      inAppEnabled: dto.inAppEnabled,
      emailEnabled: dto.emailEnabled,
      emailDigestFrequency: dto.emailDigestFrequency,
    });
  }
}
