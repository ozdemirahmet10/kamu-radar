import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { ISourceResolver } from '../application/ports/source-resolver.port';

const MANUAL_ENTRY_SOURCE_NAME = 'Manuel Giriş';

@Injectable()
export class PrismaSourceResolver implements ISourceResolver {
  constructor(private readonly prisma: PrismaService) {}

  async getManualEntrySourceId(): Promise<string> {
    const source = await this.prisma.crawlSource.findUnique({
      where: { name: MANUAL_ENTRY_SOURCE_NAME },
    });

    if (!source) {
      throw new InternalServerErrorException(
        `'${MANUAL_ENTRY_SOURCE_NAME}' kaynağı bulunamadı. 'npm run prisma:migrate:deploy && npx prisma db seed' komutunu çalıştırın.`,
      );
    }

    return source.id;
  }
}
