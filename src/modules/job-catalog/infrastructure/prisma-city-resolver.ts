import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { ICityResolver } from '../application/ports/city-resolver.port';

function normalize(text: string): string {
  return text
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/i̇/g, 'i')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');
}

@Injectable()
export class PrismaCityResolver implements ICityResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolveByName(cityName: string): Promise<string | null> {
    const normalizedTarget = normalize(cityName);
    const cities = await this.prisma.city.findMany({ select: { id: true, name: true } });
    const match = cities.find((city) => normalize(city.name) === normalizedTarget);
    return match?.id ?? null;
  }
}
