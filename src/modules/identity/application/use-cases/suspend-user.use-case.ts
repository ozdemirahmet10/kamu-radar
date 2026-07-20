import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { AuditLogService } from '../../../../common/audit/audit-log.service';

@Injectable()
export class SuspendUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(actingUserId: string, targetUserId: string, suspend: boolean): Promise<User> {
    if (actingUserId === targetUserId && suspend) {
      throw new BadRequestException('Kendi hesabınızı askıya alamazsınız');
    }

    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (suspend) {
      user.suspend();
    } else {
      user.reactivate();
    }
    await this.userRepository.save(user);

    if (suspend) {
      await this.refreshTokenRepository.revokeAllForUser(targetUserId);
    }

    await this.auditLogService.record({
      actorUserId: actingUserId,
      action: suspend ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      entityType: 'User',
      entityId: targetUserId,
    });

    return user;
  }
}
