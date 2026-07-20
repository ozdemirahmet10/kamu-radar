import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { FavoriteCategory } from '../../domain/entities/favorite-category';

export class ListMyFavoritesQueryDto {
  @ApiProperty({ enum: FavoriteCategory, required: false })
  @IsOptional()
  @IsEnum(FavoriteCategory)
  category?: FavoriteCategory;

  @ApiProperty({ enum: ['newest', 'oldest'], required: false, default: 'newest' })
  @IsOptional()
  @IsIn(['newest', 'oldest'])
  sort?: 'newest' | 'oldest';

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 10, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}
