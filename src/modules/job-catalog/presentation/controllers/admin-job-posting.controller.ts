import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@app/database';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequestUser } from '../../../identity/infrastructure/auth/jwt.strategy';
import { UserRole } from '../../../identity/domain/entities/user.entity';
import { CreateJobPostingUseCase } from '../../application/use-cases/create-job-posting.use-case';
import { UpdateJobPostingUseCase } from '../../application/use-cases/update-job-posting.use-case';
import { ArchiveJobPostingUseCase } from '../../application/use-cases/archive-job-posting.use-case';
import { ApproveJobPostingUseCase } from '../../application/use-cases/approve-job-posting.use-case';
import { ListJobPostingsUseCase } from '../../application/use-cases/list-job-postings.use-case';
import { GetJobPostingByIdUseCase } from '../../application/use-cases/get-job-posting-by-id.use-case';
import { CreateJobPostingDto } from '../../application/dto/create-job-posting.dto';
import { UpdateJobPostingDto } from '../../application/dto/update-job-posting.dto';
import { ListJobPostingsQueryDto } from '../../application/dto/list-job-postings-query.dto';
import { JobPostingResponseDto } from '../../application/dto/job-posting-response.dto';
import { AdminJobPostingResponseDto } from '../../application/dto/admin-job-posting-response.dto';
import { AdminJobPostingListResponseDto } from '../../application/dto/admin-job-posting-list-response.dto';

@ApiTags('admin/job-postings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Controller('admin/job-postings')
export class AdminJobPostingController {
  constructor(
    private readonly createJobPostingUseCase: CreateJobPostingUseCase,
    private readonly updateJobPostingUseCase: UpdateJobPostingUseCase,
    private readonly archiveJobPostingUseCase: ArchiveJobPostingUseCase,
    private readonly approveJobPostingUseCase: ApproveJobPostingUseCase,
    private readonly listJobPostingsUseCase: ListJobPostingsUseCase,
    private readonly getJobPostingByIdUseCase: GetJobPostingByIdUseCase,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * JobCatalogModule, döngüsel modül bağımlılığından kaçınmak için CrawlerModule'e
   * bağımlı olamıyor (bkz. CrawlerModule'ün zaten JobCatalogModule'e bağımlı olması) —
   * bu yüzden kaynak adları, bu admin-only uç noktada doğrudan Prisma üzerinden okunur.
   */
  private async getSourceNameMap(): Promise<Map<string, string>> {
    const sources = await this.prisma.crawlSource.findMany({ select: { id: true, name: true } });
    return new Map(sources.map((source) => [source.id, source.name]));
  }

  @Get()
  async list(@Query() query: ListJobPostingsQueryDto): Promise<AdminJobPostingListResponseDto> {
    const [result, sourceNames] = await Promise.all([
      this.listJobPostingsUseCase.execute({
        cityId: query.cityId,
        kpssScoreType: query.kpssScoreType,
        minKpssScore: query.minKpssScore,
        maxKpssScore: query.maxKpssScore,
        institutionType: query.institutionType,
        employmentType: query.employmentType,
        minimumEducationLevel: query.minimumEducationLevel,
        keyword: query.keyword,
        hasPdf: query.hasPdf,
        page: query.page,
        pageSize: query.pageSize,
        onlyPublished: query.scope !== 'all',
      }),
      this.getSourceNameMap(),
    ]);

    return {
      items: result.items.map((jobPosting) =>
        AdminJobPostingResponseDto.fromDomainWithSource(
          jobPosting,
          sourceNames.get(jobPosting.snapshot.sourceId) ?? 'Bilinmeyen Kaynak',
        ),
      ),
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<AdminJobPostingResponseDto> {
    const jobPosting = await this.getJobPostingByIdUseCase.execute(id, false);
    const sourceNames = await this.getSourceNameMap();
    return AdminJobPostingResponseDto.fromDomainWithSource(
      jobPosting,
      sourceNames.get(jobPosting.snapshot.sourceId) ?? 'Bilinmeyen Kaynak',
    );
  }

  @Get(':id/versions')
  async listVersions(@Param('id') id: string) {
    const versions = await this.prisma.jobPostingVersion.findMany({
      where: { jobPostingId: id },
      orderBy: { changedAt: 'desc' },
    });
    return versions.map((version) => ({
      id: version.id,
      snapshot: version.snapshot,
      changedAt: version.changedAt.toISOString(),
      changeReason: version.changeReason,
    }));
  }

  @Post()
  async create(@Body() dto: CreateJobPostingDto): Promise<JobPostingResponseDto> {
    const jobPosting = await this.createJobPostingUseCase.execute(dto);
    return JobPostingResponseDto.fromDomain(jobPosting);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJobPostingDto,
  ): Promise<JobPostingResponseDto> {
    const jobPosting = await this.updateJobPostingUseCase.execute(id, dto);
    return JobPostingResponseDto.fromDomain(jobPosting);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archive(@CurrentUser() actingUser: RequestUser, @Param('id') id: string): Promise<void> {
    await this.archiveJobPostingUseCase.execute(id, actingUser.userId);
  }

  @Post(':id/approve')
  async approve(
    @CurrentUser() actingUser: RequestUser,
    @Param('id') id: string,
  ): Promise<JobPostingResponseDto> {
    const jobPosting = await this.approveJobPostingUseCase.execute(id, actingUser.userId);
    return JobPostingResponseDto.fromDomain(jobPosting);
  }
}
