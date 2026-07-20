import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { InstitutionType } from '../../domain/entities/job-posting.entity';
import { InstitutionSortBy } from '../use-cases/list-institutions.use-case';

export class ListInstitutionsQueryDto {
  @ApiPropertyOptional({ description: 'Kurum adında arama' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ enum: InstitutionType })
  @IsOptional()
  @IsEnum(InstitutionType)
  institutionType?: InstitutionType;

  @ApiPropertyOptional({ enum: ['activeCount', 'nearestDeadline'] })
  @IsOptional()
  @IsIn(['activeCount', 'nearestDeadline'])
  sortBy?: InstitutionSortBy;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}
