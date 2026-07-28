import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@app/config';
import { IDatabaseDumpService } from '../application/ports/database-dump.port';

const execFileAsync = promisify(execFile);

@Injectable()
export class PgDumpService implements IDatabaseDumpService {
  constructor(private readonly configService: AppConfigService) {}

  async dump(outputFilePath: string): Promise<void> {
    const connectionUrl = new URL(this.configService.database.url);
    const databaseName = connectionUrl.pathname.replace(/^\//, '');

    await execFileAsync(
      'pg_dump',
      [
        '-h', connectionUrl.hostname,
        '-p', connectionUrl.port || '5432',
        '-U', decodeURIComponent(connectionUrl.username),
        '-d', databaseName,
        '--format=custom',
        '--file', outputFilePath,
      ],
      {
        env: { ...process.env, PGPASSWORD: decodeURIComponent(connectionUrl.password) },
      },
    );
  }
}
