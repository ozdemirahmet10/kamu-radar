import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { EducationLevel } from '@prisma/client';
import { PrismaService } from '@app/database';

interface GraduationDepartmentDto {
  id: string;
  name: string;
}

@ApiTags('reference-data')
@Controller('reference-data/graduation-departments')
export class GraduationDepartmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiQuery({ name: 'educationLevel', enum: EducationLevel, required: true })
  async list(@Query('educationLevel') educationLevel: EducationLevel): Promise<GraduationDepartmentDto[]> {
    if (!Object.values(EducationLevel).includes(educationLevel)) {
      return [];
    }
    return this.prisma.graduationDepartment.findMany({
      where: { educationLevel },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  }
}
