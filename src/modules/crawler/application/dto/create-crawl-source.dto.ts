import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCrawlSourceDto {
  @ApiProperty({ example: 'Kariyer Kapısı' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'https://isealimkariyerkapisi.cbiko.gov.tr/' })
  @IsUrl()
  baseUrl!: string;

  @ApiProperty({
    example: 'sbb-kamuilan',
    description: 'Bu anahtara sahip bir ISourceAdapter kodda kayıtlı olmalıdır',
  })
  @IsString()
  adapterKey!: string;

  @ApiPropertyOptional({ example: '0 */6 * * *', description: 'Boş bırakılırsa otomatik zamanlanmaz' })
  @IsOptional()
  @IsString()
  crawlFrequencyCron?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
