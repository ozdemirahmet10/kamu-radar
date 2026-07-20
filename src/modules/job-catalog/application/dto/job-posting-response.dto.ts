import { ApiProperty } from '@nestjs/swagger';
import { JobPosting } from '../../domain/entities/job-posting.entity';

export class JobPostingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionName!: string;

  @ApiProperty({ nullable: true })
  institutionType!: string | null;

  @ApiProperty()
  positionTitle!: string;

  @ApiProperty({ nullable: true })
  cityId!: string | null;

  @ApiProperty({ nullable: true })
  quotaCount!: number | null;

  @ApiProperty({ nullable: true })
  employmentType!: string | null;

  @ApiProperty({ nullable: true })
  minimumEducationLevel!: string | null;

  @ApiProperty({ nullable: true })
  kpssScoreType!: string | null;

  @ApiProperty({ nullable: true })
  minKpssScore!: number | null;

  @ApiProperty({ nullable: true })
  minAge!: number | null;

  @ApiProperty({ nullable: true })
  maxAge!: number | null;

  @ApiProperty()
  requiresExperience!: boolean;

  @ApiProperty({ nullable: true })
  applicationStartDate!: string | null;

  @ApiProperty({ nullable: true })
  applicationEndDate!: string | null;

  @ApiProperty({ nullable: true })
  applicationUrl!: string | null;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  hasPdf!: boolean;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: [Object] })
  qualificationCodes!: { code: string; description: string | null }[];

  @ApiProperty({ type: [String] })
  departments!: string[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromDomain(jobPosting: JobPosting): JobPostingResponseDto {
    const snapshot = jobPosting.snapshot;
    const dto = new JobPostingResponseDto();
    dto.id = jobPosting.id;
    dto.institutionName = snapshot.institutionName;
    dto.institutionType = snapshot.institutionType;
    dto.positionTitle = snapshot.positionTitle;
    dto.cityId = snapshot.cityId;
    dto.quotaCount = snapshot.quotaCount;
    dto.employmentType = snapshot.employmentType;
    dto.minimumEducationLevel = snapshot.minimumEducationLevel;
    dto.kpssScoreType = snapshot.kpssScoreType;
    dto.minKpssScore = snapshot.minKpssScore;
    dto.minAge = snapshot.minAge;
    dto.maxAge = snapshot.maxAge;
    dto.requiresExperience = snapshot.requiresExperience;
    dto.applicationStartDate = snapshot.applicationWindow.startDate?.toISOString() ?? null;
    dto.applicationEndDate = snapshot.applicationWindow.endDate?.toISOString() ?? null;
    dto.applicationUrl = snapshot.applicationUrl;
    dto.description = snapshot.description;
    dto.hasPdf = snapshot.pdfStorageKey !== null;
    dto.status = snapshot.status;
    dto.qualificationCodes = snapshot.qualificationCodes;
    dto.departments = snapshot.departments;
    dto.createdAt = snapshot.createdAt.toISOString();
    dto.updatedAt = snapshot.updatedAt.toISOString();
    return dto;
  }
}
