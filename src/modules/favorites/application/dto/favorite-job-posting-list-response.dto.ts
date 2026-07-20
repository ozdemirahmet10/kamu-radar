import { ApiProperty } from '@nestjs/swagger';
import { JobPostingResponseDto } from '../../../job-catalog/application/dto/job-posting-response.dto';
import { FavoriteCategory } from '../../domain/entities/favorite-category';
import { FavoriteJobPosting } from '../use-cases/list-my-favorites.use-case';

export class FavoriteJobPostingDto {
  @ApiProperty({ type: JobPostingResponseDto })
  jobPosting!: JobPostingResponseDto;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  matchPercentage!: number;

  @ApiProperty({ type: [String] })
  missingCriteria!: string[];

  @ApiProperty()
  favoritedAt!: string;

  @ApiProperty({ enum: FavoriteCategory })
  category!: FavoriteCategory;

  static fromDomain(favorite: FavoriteJobPosting): FavoriteJobPostingDto {
    const dto = new FavoriteJobPostingDto();
    dto.jobPosting = JobPostingResponseDto.fromDomain(favorite.jobPosting);
    dto.status = favorite.status;
    dto.matchPercentage = favorite.matchPercentage;
    dto.missingCriteria = favorite.missingCriteria;
    dto.favoritedAt = favorite.favoritedAt.toISOString();
    dto.category = favorite.category;
    return dto;
  }
}

export class FavoriteJobPostingListResponseDto {
  @ApiProperty({ type: [FavoriteJobPostingDto] })
  items!: FavoriteJobPostingDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  totalCount!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty({ type: Object })
  categoryCounts!: Record<FavoriteCategory, number>;
}
