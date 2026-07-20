import { ApiProperty } from '@nestjs/swagger';
import { JobPostingResponseDto } from '../../../job-catalog/application/dto/job-posting-response.dto';
import { MatchedJobPosting } from '../use-cases/get-my-matches.use-case';

export class MatchedJobPostingDto {
  @ApiProperty({ type: JobPostingResponseDto })
  jobPosting!: JobPostingResponseDto;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  matchPercentage!: number;

  @ApiProperty({ type: [String] })
  missingCriteria!: string[];

  static fromDomain(match: MatchedJobPosting): MatchedJobPostingDto {
    const dto = new MatchedJobPostingDto();
    dto.jobPosting = JobPostingResponseDto.fromDomain(match.jobPosting);
    dto.status = match.status;
    dto.matchPercentage = match.matchPercentage;
    dto.missingCriteria = match.missingCriteria;
    return dto;
  }
}
