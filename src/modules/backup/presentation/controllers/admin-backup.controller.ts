import { Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { UserRole } from '../../../identity/domain/entities/user.entity';
import { RunDatabaseBackupUseCase } from '../../application/use-cases/run-database-backup.use-case';
import { RAW_CONTENT_STORE } from '../../../crawler/application/ports/raw-content-store.port';
import type { IRawContentStore } from '../../../crawler/application/ports/raw-content-store.port';

const BACKUP_KEY_PREFIX = 'backups/';

@ApiTags('admin/backups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/backups')
export class AdminBackupController {
  constructor(
    private readonly runDatabaseBackupUseCase: RunDatabaseBackupUseCase,
    @Inject(RAW_CONTENT_STORE) private readonly rawContentStore: IRawContentStore,
  ) {}

  @Get()
  async list() {
    const objects = await this.rawContentStore.listByPrefix(BACKUP_KEY_PREFIX);
    return objects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  @Post('trigger')
  async trigger() {
    return this.runDatabaseBackupUseCase.execute();
  }
}
