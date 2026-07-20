import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequestUser } from '../../../identity/infrastructure/auth/jwt.strategy';
import { AddApplicationUseCase } from '../../application/use-cases/add-application.use-case';
import { RemoveApplicationUseCase } from '../../application/use-cases/remove-application.use-case';
import { UpdateApplicationUseCase } from '../../application/use-cases/update-application.use-case';
import { ListMyApplicationsUseCase } from '../../application/use-cases/list-my-applications.use-case';
import { ListMyApplicationsQueryDto } from '../../application/dto/list-my-applications-query.dto';
import { UpdateApplicationDto } from '../../application/dto/update-application.dto';
import {
  ApplicationDto,
  ApplicationListResponseDto,
  UpcomingApplicationEventDto,
} from '../../application/dto/application-list-response.dto';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';

@ApiTags('me/applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/applications')
export class MeApplicationsController {
  constructor(
    private readonly addApplicationUseCase: AddApplicationUseCase,
    private readonly removeApplicationUseCase: RemoveApplicationUseCase,
    private readonly updateApplicationUseCase: UpdateApplicationUseCase,
    private readonly listMyApplicationsUseCase: ListMyApplicationsUseCase,
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListMyApplicationsQueryDto,
  ): Promise<ApplicationListResponseDto> {
    const result = await this.listMyApplicationsUseCase.execute({
      userId: user.userId,
      status: query.status,
      keyword: query.keyword,
      cityId: query.cityId,
      kpssScoreType: query.kpssScoreType,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      sort: query.sort,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
    });

    return {
      items: result.items.map(ApplicationDto.fromDomain),
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      stats: result.stats,
      upcoming: result.upcoming.map(UpcomingApplicationEventDto.fromDomain),
    };
  }

  @Get('ids')
  async listIds(@CurrentUser() user: RequestUser): Promise<string[]> {
    return this.applicationRepository.listJobPostingIdsByUser(user.userId);
  }

  @Post(':jobPostingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async add(
    @CurrentUser() user: RequestUser,
    @Param('jobPostingId') jobPostingId: string,
  ): Promise<void> {
    await this.addApplicationUseCase.execute(user.userId, jobPostingId);
  }

  @Patch(':jobPostingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentUser() user: RequestUser,
    @Param('jobPostingId') jobPostingId: string,
    @Body() dto: UpdateApplicationDto,
  ): Promise<void> {
    await this.updateApplicationUseCase.execute(user.userId, jobPostingId, {
      status: dto.status,
      note: dto.note !== undefined ? (dto.note === '' ? null : dto.note) : undefined,
      nextActionLabel:
        dto.nextActionLabel !== undefined
          ? dto.nextActionLabel === ''
            ? null
            : dto.nextActionLabel
          : undefined,
      nextActionDate:
        dto.nextActionDate !== undefined
          ? dto.nextActionDate === ''
            ? null
            : new Date(dto.nextActionDate)
          : undefined,
    });
  }

  @Delete(':jobPostingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('jobPostingId') jobPostingId: string,
  ): Promise<void> {
    await this.removeApplicationUseCase.execute(user.userId, jobPostingId);
  }
}
