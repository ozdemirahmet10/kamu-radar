import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EducationLevel, Prisma } from '@prisma/client';
import { PrismaService } from '@app/database';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { UserRole } from '../../../identity/domain/entities/user.entity';
import { QualificationCodeService } from '../../../identity/application/services/qualification-code.service';

class SearchQualificationCodesQueryDto {
  @ApiPropertyOptional({ description: 'Kod veya açıklama içinde arama' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ enum: EducationLevel })
  @IsOptional()
  @IsEnum(EducationLevel)
  educationLevel?: EducationLevel;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

@ApiTags('admin/qualification-codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/qualification-codes')
export class AdminQualificationCodesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qualificationCodeService: QualificationCodeService,
  ) {}

  @Get()
  async search(@Query() query: SearchQualificationCodesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.QualificationCodeWhereInput = {
      educationLevel: query.educationLevel || undefined,
      OR: query.keyword
        ? [
            { code: { contains: query.keyword, mode: 'insensitive' } },
            { description: { contains: query.keyword, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [records, totalCount] = await this.prisma.$transaction([
      this.prisma.qualificationCode.findMany({
        where,
        orderBy: { code: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.qualificationCode.count({ where }),
    ]);

    return {
      items: records,
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    };
  }

  @Get('by-department/:departmentId')
  async byDepartment(@Param('departmentId') departmentId: string) {
    return this.qualificationCodeService.getCodesForDepartment(departmentId);
  }

  @Get('stats')
  @ApiQuery({ name: 'educationLevel', enum: EducationLevel, required: false })
  async stats() {
    const [totalCodes, totalDepartments, byLevel] = await Promise.all([
      this.prisma.qualificationCode.count(),
      this.prisma.graduationDepartment.count(),
      this.prisma.qualificationCode.groupBy({ by: ['educationLevel'], _count: { _all: true } }),
    ]);

    const codesByLevel: Record<string, number> = {};
    for (const row of byLevel) {
      codesByLevel[row.educationLevel] = row._count._all;
    }

    return { totalCodes, totalDepartments, codesByLevel };
  }
}
