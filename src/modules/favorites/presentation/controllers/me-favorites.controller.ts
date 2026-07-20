import { Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequestUser } from '../../../identity/infrastructure/auth/jwt.strategy';
import { AddFavoriteUseCase } from '../../application/use-cases/add-favorite.use-case';
import { RemoveFavoriteUseCase } from '../../application/use-cases/remove-favorite.use-case';
import { ListMyFavoritesUseCase } from '../../application/use-cases/list-my-favorites.use-case';
import { ListMyFavoritesQueryDto } from '../../application/dto/list-my-favorites-query.dto';
import {
  FavoriteJobPostingDto,
  FavoriteJobPostingListResponseDto,
} from '../../application/dto/favorite-job-posting-list-response.dto';
import {
  FAVORITE_REPOSITORY,
  IFavoriteRepository,
} from '../../domain/repositories/favorite.repository.interface';

@ApiTags('me/favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/favorites')
export class MeFavoritesController {
  constructor(
    private readonly addFavoriteUseCase: AddFavoriteUseCase,
    private readonly removeFavoriteUseCase: RemoveFavoriteUseCase,
    private readonly listMyFavoritesUseCase: ListMyFavoritesUseCase,
    @Inject(FAVORITE_REPOSITORY) private readonly favoriteRepository: IFavoriteRepository,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListMyFavoritesQueryDto,
  ): Promise<FavoriteJobPostingListResponseDto> {
    const result = await this.listMyFavoritesUseCase.execute({
      userId: user.userId,
      category: query.category,
      sort: query.sort,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
    });

    return {
      items: result.items.map(FavoriteJobPostingDto.fromDomain),
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      categoryCounts: result.categoryCounts,
    };
  }

  /**
   * Tüm İlanlar/Bana Uygun İlanlar/İlan Detayı gibi diğer sayfalarda kalp
   * ikonunun dolu/boş gösterilmesi için sadece favorilenen ilan id'lerini döner.
   */
  @Get('ids')
  async listIds(@CurrentUser() user: RequestUser): Promise<string[]> {
    return this.favoriteRepository.listJobPostingIdsByUser(user.userId);
  }

  @Post(':jobPostingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async add(@CurrentUser() user: RequestUser, @Param('jobPostingId') jobPostingId: string): Promise<void> {
    await this.addFavoriteUseCase.execute(user.userId, jobPostingId);
  }

  @Delete(':jobPostingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('jobPostingId') jobPostingId: string,
  ): Promise<void> {
    await this.removeFavoriteUseCase.execute(user.userId, jobPostingId);
  }
}
