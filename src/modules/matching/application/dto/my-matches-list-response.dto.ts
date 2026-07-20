import { ApiProperty } from '@nestjs/swagger';
import { MatchedJobPostingDto } from './matched-job-posting.dto';

export class MyMatchesListResponseDto {
  @ApiProperty({ type: [MatchedJobPostingDto] })
  items!: MatchedJobPostingDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  totalCount!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty({ type: Object, description: 'Her uygunluk durumu için ilan sayısı' })
  statusCounts!: Record<string, number>;
}
