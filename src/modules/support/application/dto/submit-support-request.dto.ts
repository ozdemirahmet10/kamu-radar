import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export enum SupportRequestType {
  GORUS = 'GORUS',
  TALEP = 'TALEP',
  ONERI = 'ONERI',
}

export class SubmitSupportRequestDto {
  @ApiProperty({ enum: SupportRequestType })
  @IsEnum(SupportRequestType)
  type!: SupportRequestType;

  @ApiProperty({ minLength: 10, maxLength: 2000 })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;
}
