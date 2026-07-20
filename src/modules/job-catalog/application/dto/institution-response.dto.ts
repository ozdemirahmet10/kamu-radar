import { ApiProperty } from '@nestjs/swagger';
import { InstitutionSummary } from '../use-cases/list-institutions.use-case';

export class InstitutionResponseDto {
  @ApiProperty()
  institutionName!: string;

  @ApiProperty({ nullable: true })
  institutionType!: string | null;

  @ApiProperty()
  activeJobPostingCount!: number;

  @ApiProperty({ nullable: true })
  totalQuota!: number | null;

  @ApiProperty({ nullable: true })
  nearestDeadline!: string | null;

  @ApiProperty({ type: [String] })
  cityIds!: string[];

  static fromDomain(summary: InstitutionSummary): InstitutionResponseDto {
    const dto = new InstitutionResponseDto();
    dto.institutionName = summary.institutionName;
    dto.institutionType = summary.institutionType;
    dto.activeJobPostingCount = summary.activeJobPostingCount;
    dto.totalQuota = summary.totalQuota;
    dto.nearestDeadline = summary.nearestDeadline?.toISOString() ?? null;
    dto.cityIds = summary.cityIds;
    return dto;
  }
}

export class InstitutionListResponseDto {
  @ApiProperty({ type: [InstitutionResponseDto] })
  items!: InstitutionResponseDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  totalCount!: number;

  @ApiProperty()
  totalPages!: number;
}
