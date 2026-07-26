import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@app/database';

export interface RecordAuditLogParams {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: unknown;
  createdAt: Date;
}

export interface ListForUserResult {
  items: AuditLogRecord[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: RecordAuditLogParams): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        changes: (params.changes as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }

  /** Kullanıcının kendi güvenlik geçmişi ("Ayarlar" sayfası) için — sadece kendi USER kayıtları. */
  async listForUser(userId: string, page: number, pageSize: number): Promise<ListForUserResult> {
    const where: Prisma.AuditLogWhereInput = { entityType: 'USER', entityId: userId };
    const [records, totalCount] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: records.map((record) => ({
        id: record.id,
        action: record.action,
        entityType: record.entityType,
        entityId: record.entityId,
        changes: record.changes,
        createdAt: record.createdAt,
      })),
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    };
  }
}
