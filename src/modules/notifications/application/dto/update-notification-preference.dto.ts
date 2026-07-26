import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { DigestFrequency } from '../../domain/repositories/notification-preference.repository.interface';

export class UpdateNotificationPreferenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ enum: ['INSTANT', 'DAILY'] })
  @IsOptional()
  @IsIn(['INSTANT', 'DAILY'])
  emailDigestFrequency?: DigestFrequency;
}
