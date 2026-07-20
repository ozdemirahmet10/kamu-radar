import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListInstitutionsUseCase } from '../../application/use-cases/list-institutions.use-case';
import { ListInstitutionsQueryDto } from '../../application/dto/list-institutions-query.dto';
import { InstitutionListResponseDto, InstitutionResponseDto } from '../../application/dto/institution-response.dto';

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionController {
  constructor(private readonly listInstitutionsUseCase: ListInstitutionsUseCase) {}

  @Get()
  async list(@Query() query: ListInstitutionsQueryDto): Promise<InstitutionListResponseDto> {
    const result = await this.listInstitutionsUseCase.execute({
      keyword: query.keyword,
      institutionType: query.institutionType,
      sortBy: query.sortBy,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    });

    return {
      items: result.items.map(InstitutionResponseDto.fromDomain),
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    };
  }
}
