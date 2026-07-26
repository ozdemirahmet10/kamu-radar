import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { MatchingModule } from '../matching/matching.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { ApplicationsModule } from '../applications/applications.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { ExportMyDataUseCase } from './application/use-cases/export-my-data.use-case';
import { DataExportController } from './presentation/controllers/data-export.controller';

@Module({
  imports: [IdentityModule, MatchingModule, FavoritesModule, ApplicationsModule, NotificationsModule],
  controllers: [DataExportController],
  providers: [ExportMyDataUseCase],
})
export class DataExportModule {}
