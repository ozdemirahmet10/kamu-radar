import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@app/database';

interface CityDto {
  id: string;
  name: string;
  plateCode: number;
}

@ApiTags('reference-data')
@Controller('cities')
export class CitiesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(): Promise<CityDto[]> {
    return this.prisma.city.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, plateCode: true },
    });
  }
}
