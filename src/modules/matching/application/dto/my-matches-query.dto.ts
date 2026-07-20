import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { EligibilityStatus } from '../../domain/entities/eligibility-result';
import {
  EducationLevel,
  EmploymentType,
  InstitutionType,
} from '../../../job-catalog/domain/entities/job-posting.entity';

export class MyMatchesQueryDto {
  @ApiPropertyOptional({
    enum: EligibilityStatus,
    isArray: true,
    description: 'Virgülle ayrılmış durum filtresi, örn. ELIGIBLE,PARTIALLY_ELIGIBLE',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  @IsEnum(EligibilityStatus, { each: true })
  statuses?: EligibilityStatus[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiPropertyOptional({ example: 'P93' })
  @IsOptional()
  @IsString()
  kpssScoreType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minKpssScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxKpssScore?: number;

  @ApiPropertyOptional({ enum: InstitutionType })
  @IsOptional()
  @IsEnum(InstitutionType)
  institutionType?: InstitutionType;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: EducationLevel })
  @IsOptional()
  @IsEnum(EducationLevel)
  minimumEducationLevel?: EducationLevel;

  @ApiPropertyOptional({ description: 'Kurum veya kadro adında arama' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'true verilirse yalnızca PDF dokümanı eklenen ilanlar döner' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasPdf?: boolean;

  @ApiPropertyOptional({ description: 'Yalnızca bu tarihten sonra eklenen ilanlar (örn. bugün eklenenler)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAfter?: Date;

  @ApiPropertyOptional({ description: 'Son başvuru tarihi bugünden itibaren N gün içinde olan ilanlar' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  deadlineWithinDays?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}
