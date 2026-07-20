import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QualificationCodeDto {
  @ApiProperty({ example: '2211' })
  @IsString()
  code!: string;

  @ApiPropertyOptional({ example: 'Bilgisayar İşletmeni' })
  @IsOptional()
  @IsString()
  description?: string;
}
