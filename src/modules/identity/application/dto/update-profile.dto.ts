import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  DisabilityStatus,
  EducationLevel,
  MilitaryStatus,
} from '../../domain/entities/user-profile.entity';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: '1998-05-14', description: 'ISO 8601 tarih' })
  @IsOptional()
  @IsISO8601()
  birthDate?: string;

  @ApiPropertyOptional({ enum: EducationLevel })
  @IsOptional()
  @IsEnum(EducationLevel)
  educationLevel?: EducationLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  graduationSchool?: string;

  @ApiPropertyOptional({ description: 'GraduationDepartment id (bölüm)' })
  @IsOptional()
  @IsString()
  graduationDepartmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  kpssScoreType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  kpssScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(2000)
  kpssYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  drivingLicense?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ydsScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ydsType?: string;

  @ApiPropertyOptional({ enum: MilitaryStatus })
  @IsOptional()
  @IsEnum(MilitaryStatus)
  militaryStatus?: MilitaryStatus;

  @ApiPropertyOptional({ enum: DisabilityStatus })
  @IsOptional()
  @IsEnum(DisabilityStatus)
  disabilityStatus?: DisabilityStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certificates?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  preferredCityIds?: string[];
}
