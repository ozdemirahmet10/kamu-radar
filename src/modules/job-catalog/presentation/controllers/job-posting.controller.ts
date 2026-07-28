import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListJobPostingsUseCase } from '../../application/use-cases/list-job-postings.use-case';
import { GetJobPostingByIdUseCase } from '../../application/use-cases/get-job-posting-by-id.use-case';
import { PublicListJobPostingsQueryDto } from '../../application/dto/public-list-job-postings-query.dto';
import { JobPostingResponseDto } from '../../application/dto/job-posting-response.dto';
import { JobPostingListResponseDto } from '../../application/dto/job-posting-list-response.dto';

@ApiTags('job-postings')
@Controller('job-postings')
export class JobPostingController {
  constructor(
    private readonly listJobPostingsUseCase: ListJobPostingsUseCase,
    private readonly getJobPostingByIdUseCase: GetJobPostingByIdUseCase,
  ) {}

  @Get()
  async list(@Query() query: PublicListJobPostingsQueryDto): Promise<JobPostingListResponseDto> {
    const result = await this.listJobPostingsUseCase.execute({
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
      page: query.page,
      pageSize: query.pageSize,
      onlyPublished: true,
    });

    return {
      items: result.items.map(JobPostingResponseDto.fromDomain),
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<JobPostingResponseDto> {
    const jobPosting = await this.getJobPostingByIdUseCase.execute(id, true);
    return JobPostingResponseDto.fromDomain(jobPosting);
  }
}
