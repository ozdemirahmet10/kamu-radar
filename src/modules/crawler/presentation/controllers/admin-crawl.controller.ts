import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { UserRole } from '../../../identity/domain/entities/user.entity';
import { RunCrawlForSourceUseCase } from '../../application/use-cases/run-crawl-for-source.use-case';
import {
  CRAWL_SOURCE_REPOSITORY,
  ICrawlSourceRepository,
} from '../../domain/repositories/crawl-source.repository.interface';
import {
  CRAWL_RUN_REPOSITORY,
  ICrawlRunRepository,
} from '../../domain/repositories/crawl-run.repository.interface';
import { CrawlSchedulerService } from '../../infrastructure/queue/crawl-scheduler.service';
import { CreateCrawlSourceDto } from '../../application/dto/create-crawl-source.dto';
import { UpdateCrawlSourceDto } from '../../application/dto/update-crawl-source.dto';
import { SOURCE_ADAPTER_REGISTRY, SourceAdapterRegistry } from '../../application/ports/source-adapter.port';

class TriggerCrawlDto {
  @ApiProperty({ required: false, default: 10, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  maxItems?: number;
}

@ApiTags('admin/crawl')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/crawl-sources')
export class AdminCrawlController {
  constructor(
    private readonly runCrawlForSourceUseCase: RunCrawlForSourceUseCase,
    private readonly crawlSchedulerService: CrawlSchedulerService,
    @Inject(CRAWL_SOURCE_REPOSITORY) private readonly crawlSourceRepository: ICrawlSourceRepository,
    @Inject(CRAWL_RUN_REPOSITORY) private readonly crawlRunRepository: ICrawlRunRepository,
    @Inject(SOURCE_ADAPTER_REGISTRY) private readonly adapterRegistry: SourceAdapterRegistry,
  ) {}

  @Get()
  async list() {
    return this.crawlSourceRepository.findAll();
  }

  /**
   * Kodda gerçekten yazılmış (ISourceAdapter implementasyonu bulunan) adapter
   * anahtarlarını döner. Bir kaynağın adapterKey'i burada listelenmeyen bir
   * değerdeyse, tarama tetiklendiğinde "adapter kayıtlı değil" hatası alınır —
   * yeni bir site için önce kodda yeni bir adapter yazılması gerekir.
   */
  @Get('adapters')
  async listAdapters() {
    return Array.from(this.adapterRegistry.keys()).map((key) => ({ adapterKey: key }));
  }

  @Get('runs')
  async listRuns() {
    return this.crawlRunRepository.findAll(50);
  }

  @Post()
  async create(@Body() dto: CreateCrawlSourceDto) {
    const source = await this.crawlSourceRepository.create({
      name: dto.name,
      baseUrl: dto.baseUrl,
      adapterKey: dto.adapterKey,
      crawlFrequencyCron: dto.crawlFrequencyCron ?? '',
      isActive: dto.isActive ?? true,
    });
    await this.crawlSchedulerService.syncSchedules();
    return source;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCrawlSourceDto) {
    const source = await this.crawlSourceRepository.update(id, dto);
    await this.crawlSchedulerService.syncSchedules();
    return source;
  }

  @Post(':id/trigger')
  async trigger(@Param('id') id: string, @Body() dto: TriggerCrawlDto) {
    return this.runCrawlForSourceUseCase.execute(id, dto.maxItems);
  }
}
