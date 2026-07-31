import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequestUser } from '../../../identity/infrastructure/auth/jwt.strategy';
import { GetMyMatchesUseCase } from '../../application/use-cases/get-my-matches.use-case';
import { MyMatchesQueryDto } from '../../application/dto/my-matches-query.dto';
import { MyMatchesListResponseDto } from '../../application/dto/my-matches-list-response.dto';
import { MatchedJobPostingDto } from '../../application/dto/matched-job-posting.dto';

@ApiTags('me/matches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/matches')
export class MeMatchesController {
  constructor(private readonly getMyMatchesUseCase: GetMyMatchesUseCase) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query() query: MyMatchesQueryDto,
  ): Promise<MyMatchesListResponseDto> {
    const result = await this.getMyMatchesUseCase.execute({
      userId: user.userId,
      statuses: query.statuses,
      cityId: query.cityId,
      kpssScoreType: query.kpssScoreType,
      minKpssScore: query.minKpssScore,
      maxKpssScore: query.maxKpssScore,
      institutionType: query.institutionType,
      employmentType: query.employmentType,
      minimumEducationLevel: query.minimumEducationLevel,
      keyword: query.keyword,
      hasPdf: query.hasPdf,
      createdAfter: query.createdAfter,
      deadlineWithinDays: query.deadlineWithinDays,
      sortBy: query.sortBy,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
    });

    return {
      items: result.items.map(MatchedJobPostingDto.fromDomain),
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      statusCounts: result.statusCounts,
    };
  }
}
