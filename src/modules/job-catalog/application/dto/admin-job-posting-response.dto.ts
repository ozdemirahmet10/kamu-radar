import { ApiProperty } from '@nestjs/swagger';
import { JobPosting } from '../../domain/entities/job-posting.entity';
import { JobPostingResponseDto } from './job-posting-response.dto';

export class AdminJobPostingResponseDto extends JobPostingResponseDto {
  @ApiProperty()
  sourceId!: string;

  @ApiProperty()
  sourceName!: string;

  static fromDomainWithSource(jobPosting: JobPosting, sourceName: string): AdminJobPostingResponseDto {
    const base = JobPostingResponseDto.fromDomain(jobPosting);
    const dto = Object.assign(new AdminJobPostingResponseDto(), base);
    dto.sourceId = jobPosting.snapshot.sourceId;
    dto.sourceName = sourceName;
    return dto;
  }
}
