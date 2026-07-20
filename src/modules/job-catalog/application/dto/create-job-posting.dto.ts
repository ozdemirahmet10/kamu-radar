import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  EducationLevel,
  EmploymentType,
  InstitutionType,
} from '../../domain/entities/job-posting.entity';
import { QualificationCodeDto } from './qualification-code.dto';

export class CreateJobPostingDto {
  @ApiProperty({ example: 'Atakum Belediyesi' })
  @IsString()
  institutionName!: string;

  @ApiProperty({ example: 'Memur (Bilgisayar İşletmeni)' })
  @IsString()
  positionTitle!: string;

  @ApiPropertyOptional({ enum: InstitutionType })
  @IsOptional()
  @IsEnum(InstitutionType)
  institutionType?: InstitutionType;

  @ApiPropertyOptional({ description: 'City tablosundaki id' })
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quotaCount?: number;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: EducationLevel })
  @IsOptional()
  @IsEnum(EducationLevel)
  minimumEducationLevel?: EducationLevel;

  @ApiPropertyOptional({ example: 'P93' })
  @IsOptional()
  @IsString()
  kpssScoreType?: string;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minKpssScore?: number;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minAge?: number;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxAge?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresExperience?: boolean;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  applicationStartDate?: string;

  @ApiPropertyOptional({ example: '2026-08-15T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  applicationEndDate?: string;

  @ApiPropertyOptional({ example: 'https://ilan.kurum.gov.tr/basvuru' })
  @IsOptional()
  @IsUrl()
  applicationUrl?: string;

  @ApiPropertyOptional({ example: 'Sanayi ve Teknoloji Bakanlığı merkez teşkilatında...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [QualificationCodeDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => QualificationCodeDto)
  qualificationCodes?: QualificationCodeDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departments?: string[];
}
