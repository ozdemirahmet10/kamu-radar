import { Injectable } from '@nestjs/common';
import { AuditLogService, ListForUserResult } from '../../../../common/audit/audit-log.service';

@Injectable()
export class GetMySecurityHistoryUseCase {
  constructor(private readonly auditLogService: AuditLogService) {}

  async execute(userId: string, page: number, pageSize: number): Promise<ListForUserResult> {
    return this.auditLogService.listForUser(userId, page, pageSize);
  }
}
