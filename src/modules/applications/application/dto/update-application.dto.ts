import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApplicationStatus } from '../../domain/entities/application-status';

export class UpdateApplicationDto {
  @ApiProperty({ enum: ApplicationStatus, required: false })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiProperty({ required: false, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nextActionLabel?: string;

  @ApiProperty({ required: false, description: 'ISO tarih, temizlemek için boş string' })
  @IsOptional()
  @IsString()
  nextActionDate?: string;
}
