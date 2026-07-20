import { ApiProperty } from '@nestjs/swagger';
import { JobPostingResponseDto } from './job-posting-response.dto';

export class JobPostingListResponseDto {
  @ApiProperty({ type: [JobPostingResponseDto] })
  items!: JobPostingResponseDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  totalCount!: number;

  @ApiProperty()
  totalPages!: number;
}
