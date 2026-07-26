import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppConfigModule, AppConfigService } from '@app/config';
import { AppLoggerModule } from '@app/logger';
import { DatabaseModule } from '@app/database';

import { IdentityModule } from './modules/identity/identity.module';
import { JobCatalogModule } from './modules/job-catalog/job-catalog.module';
import { ReferenceDataModule } from './modules/reference-data/reference-data.module';
import { CrawlerModule } from './modules/crawler/crawler.module';
import { MatchingModule } from './modules/matching/matching.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { DataExportModule } from './modules/data-export/data-export.module';
import { HealthController } from './common/controllers/health.controller';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { AuditLogModule } from './common/audit/audit-log.module';
import { AdminDashboardModule } from './common/dashboard/admin-dashboard.module';

@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    DatabaseModule,
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        throttlers: [
          { ttl: configService.throttle.ttl * 1000, limit: configService.throttle.limit },
        ],
      }),
    }),
    AuditLogModule,
    AdminDashboardModule,
    IdentityModule,
    JobCatalogModule,
    ReferenceDataModule,
    CrawlerModule,
    MatchingModule,
    FavoritesModule,
    NotificationsModule,
    ApplicationsModule,
    DataExportModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  ],
})
export class AppModule {}
