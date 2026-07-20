import { ApiProperty } from '@nestjs/swagger';
import { JobPostingResponseDto } from '../../../job-catalog/application/dto/job-posting-response.dto';
import { ApplicationStatus } from '../../domain/entities/application-status';
import {
  ApplicationStats,
  ApplicationWithJobPosting,
  UpcomingApplicationEvent,
} from '../use-cases/list-my-applications.use-case';

export class ApplicationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: JobPostingResponseDto })
  jobPosting!: JobPostingResponseDto;

  @ApiProperty({ enum: ApplicationStatus })
  status!: ApplicationStatus;

  @ApiProperty({ nullable: true })
  note!: string | null;

  @ApiProperty({ nullable: true })
  nextActionLabel!: string | null;

  @ApiProperty({ nullable: true })
  nextActionDate!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromDomain(item: ApplicationWithJobPosting): ApplicationDto {
    const dto = new ApplicationDto();
    dto.id = item.application.id;
    dto.jobPosting = JobPostingResponseDto.fromDomain(item.jobPosting);
    dto.status = item.application.status;
    dto.note = item.application.note;
    dto.nextActionLabel = item.application.nextActionLabel;
    dto.nextActionDate = item.application.nextActionDate?.toISOString() ?? null;
    dto.createdAt = item.application.createdAt.toISOString();
    dto.updatedAt = item.application.updatedAt.toISOString();
    return dto;
  }
}

export class UpcomingApplicationEventDto {
  @ApiProperty()
  jobPostingId!: string;

  @ApiProperty()
  institutionName!: string;

  @ApiProperty()
  positionTitle!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  date!: string;

  static fromDomain(event: UpcomingApplicationEvent): UpcomingApplicationEventDto {
    const dto = new UpcomingApplicationEventDto();
    dto.jobPostingId = event.jobPostingId;
    dto.institutionName = event.institutionName;
    dto.positionTitle = event.positionTitle;
    dto.label = event.label;
    dto.date = event.date.toISOString();
    return dto;
  }
}

export class ApplicationListResponseDto {
  @ApiProperty({ type: [ApplicationDto] })
  items!: ApplicationDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  totalCount!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty({ type: Object })
  stats!: ApplicationStats;

  @ApiProperty({ type: [UpcomingApplicationEventDto] })
  upcoming!: UpcomingApplicationEventDto[];
}
