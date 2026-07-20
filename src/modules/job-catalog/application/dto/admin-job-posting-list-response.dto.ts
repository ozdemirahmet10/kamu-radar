import { ApiProperty } from '@nestjs/swagger';
import { AdminJobPostingResponseDto } from './admin-job-posting-response.dto';

export class AdminJobPostingListResponseDto {
  @ApiProperty({ type: [AdminJobPostingResponseDto] })
  items!: AdminJobPostingResponseDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  totalCount!: number;

  @ApiProperty()
  totalPages!: number;
}
