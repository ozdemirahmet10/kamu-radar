import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { UserRole } from '../../../identity/domain/entities/user.entity';
import { GetMatchFeedbackOverviewUseCase } from '../../application/use-cases/get-match-feedback-overview.use-case';
import {
  JOB_POSTING_REPOSITORY,
  IJobPostingRepository,
} from '../../../job-catalog/domain/repositories/job-posting.repository.interface';

@ApiTags('admin/match-feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/match-feedback')
export class AdminMatchFeedbackController {
  constructor(
    private readonly getMatchFeedbackOverviewUseCase: GetMatchFeedbackOverviewUseCase,
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
  ) {}

  @Get()
  async overview() {
    const { stats, recent } = await this.getMatchFeedbackOverviewUseCase.execute();
    const jobPostings = await this.jobPostingRepository.findByIds(
      recent.map((item) => item.jobPostingId),
    );
    const jobPostingById = new Map(jobPostings.map((job) => [job.id, job.snapshot]));

    return {
      stats,
      recent: recent.map((item) => ({
        ...item,
        jobPosting: jobPostingById.has(item.jobPostingId)
          ? {
              institutionName: jobPostingById.get(item.jobPostingId)!.institutionName,
              positionTitle: jobPostingById.get(item.jobPostingId)!.positionTitle,
            }
          : null,
      })),
    };
  }
}
