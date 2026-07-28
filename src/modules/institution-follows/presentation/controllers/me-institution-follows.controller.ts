import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequestUser } from '../../../identity/infrastructure/auth/jwt.strategy';
import { FollowInstitutionUseCase } from '../../application/use-cases/follow-institution.use-case';
import { UnfollowInstitutionUseCase } from '../../application/use-cases/unfollow-institution.use-case';
import { ListMyFollowedInstitutionsUseCase } from '../../application/use-cases/list-my-followed-institutions.use-case';
import { InstitutionFollowRecord } from '../../domain/repositories/institution-follow.repository.interface';

@ApiTags('me/institution-follows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/institution-follows')
export class MeInstitutionFollowsController {
  constructor(
    private readonly followInstitutionUseCase: FollowInstitutionUseCase,
    private readonly unfollowInstitutionUseCase: UnfollowInstitutionUseCase,
    private readonly listMyFollowedInstitutionsUseCase: ListMyFollowedInstitutionsUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: RequestUser): Promise<InstitutionFollowRecord[]> {
    return this.listMyFollowedInstitutionsUseCase.execute(user.userId);
  }

  @Post(':institutionName')
  @HttpCode(HttpStatus.NO_CONTENT)
  async follow(
    @CurrentUser() user: RequestUser,
    @Param('institutionName') institutionName: string,
  ): Promise<void> {
    await this.followInstitutionUseCase.execute(user.userId, institutionName);
  }

  @Delete(':institutionName')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(
    @CurrentUser() user: RequestUser,
    @Param('institutionName') institutionName: string,
  ): Promise<void> {
    await this.unfollowInstitutionUseCase.execute(user.userId, institutionName);
  }
}
