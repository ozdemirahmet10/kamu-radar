import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@app/database';
import { JwtAuthGuard } from '../../modules/identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/identity/presentation/guards/roles.guard';
import { Roles } from '../../modules/identity/presentation/decorators/roles.decorator';
import { UserRole } from '../../modules/identity/domain/entities/user.entity';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

@ApiTags('admin/audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/audit-logs')
export class AuditLogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: AuditLogQueryDto) {
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    const where: Prisma.AuditLogWhereInput = {
      entityType: query.entityType || undefined,
      actorUserId: query.actorUserId || undefined,
    };

    const [records, totalCount] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { email: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: records.map((record) => ({
        id: record.id,
        actorUserId: record.actorUserId,
        actorEmail: record.actor?.email ?? null,
        actorFullName: record.actor?.fullName ?? null,
        action: record.action,
        entityType: record.entityType,
        entityId: record.entityId,
        changes: record.changes,
        createdAt: record.createdAt.toISOString(),
      })),
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    };
  }
}
