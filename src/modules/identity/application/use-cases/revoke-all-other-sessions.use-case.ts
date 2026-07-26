import { Inject, Injectable } from '@nestjs/common';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { AuditLogService } from '../../../../common/audit/audit-log.service';

@Injectable()
export class RevokeAllOtherSessionsUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(userId: string, currentSessionId: string): Promise<{ revokedCount: number }> {
    const revokedCount = await this.refreshTokenRepository.revokeAllForUserExcept(
      userId,
      currentSessionId,
    );
    await this.auditLogService.record({
      actorUserId: userId,
      action: 'SESSIONS_BULK_REVOKED',
      entityType: 'USER',
      entityId: userId,
      changes: { revokedCount },
    });
    return { revokedCount };
  }
}
