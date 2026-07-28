import { randomUUID } from 'node:crypto';
import { unlink, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DATABASE_DUMP_SERVICE } from '../ports/database-dump.port';
import type { IDatabaseDumpService } from '../ports/database-dump.port';
import { RAW_CONTENT_STORE } from '../../../crawler/application/ports/raw-content-store.port';
import type { IRawContentStore } from '../../../crawler/application/ports/raw-content-store.port';

const BACKUP_KEY_PREFIX = 'backups/';
const RETENTION_DAYS = 14;

export interface DatabaseBackupResult {
  key: string;
  sizeBytes: number;
  prunedCount: number;
}

@Injectable()
export class RunDatabaseBackupUseCase {
  private readonly logger = new Logger(RunDatabaseBackupUseCase.name);

  constructor(
    @Inject(DATABASE_DUMP_SERVICE) private readonly dumpService: IDatabaseDumpService,
    @Inject(RAW_CONTENT_STORE) private readonly rawContentStore: IRawContentStore,
  ) {}

  async execute(): Promise<DatabaseBackupResult> {
    const tmpFilePath = join(tmpdir(), `db-backup-${randomUUID()}.dump`);

    try {
      await this.dumpService.dump(tmpFilePath);
      const dumpBuffer = await readFile(tmpFilePath);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const key = `${BACKUP_KEY_PREFIX}db-backup-${timestamp}.dump`;
      await this.rawContentStore.store(key, dumpBuffer, 'application/octet-stream');

      const prunedCount = await this.pruneOldBackups();

      return { key, sizeBytes: dumpBuffer.length, prunedCount };
    } finally {
      await unlink(tmpFilePath).catch(() => undefined);
    }
  }

  private async pruneOldBackups(): Promise<number> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const objects = await this.rawContentStore.listByPrefix(BACKUP_KEY_PREFIX);
    const staleObjects = objects.filter((object) => object.lastModified < cutoff);

    for (const object of staleObjects) {
      await this.rawContentStore.delete(object.key);
      this.logger.log(`Süresi geçen yedek silindi: ${object.key}`);
    }

    return staleObjects.length;
  }
}
