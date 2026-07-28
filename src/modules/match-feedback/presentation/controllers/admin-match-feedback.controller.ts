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
import {
  USER_REPOSITORY,
  IUserRepository,
} from '../../../identity/domain/repositories/user.repository.interface';

@ApiTags('admin/match-feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/match-feedback')
export class AdminMatchFeedbackController {
  constructor(
    private readonly getMatchFeedbackOverviewUseCase: GetMatchFeedbackOverviewUseCase,
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  @Get()
  async overview() {
    const { stats, recent } = await this.getMatchFeedbackOverviewUseCase.execute();
    const [jobPostings, users] = await Promise.all([
      this.jobPostingRepository.findByIds(recent.map((item) => item.jobPostingId)),
      this.userRepository.findByIds(recent.map((item) => item.userId)),
    ]);
    const jobPostingById = new Map(jobPostings.map((job) => [job.id, job.snapshot]));
    const userById = new Map(users.map((user) => [user.id, user]));

    return {
      stats,
      recent: recent.map((item) => {
        const user = userById.get(item.userId);
        return {
          ...item,
          jobPosting: jobPostingById.has(item.jobPostingId)
            ? {
                institutionName: jobPostingById.get(item.jobPostingId)!.institutionName,
                positionTitle: jobPostingById.get(item.jobPostingId)!.positionTitle,
              }
            : null,
          user: user ? { email: user.email.value, fullName: user.fullName } : null,
        };
      }),
    };
  }
}
