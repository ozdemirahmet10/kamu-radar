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
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(actingUserId: string, targetUserId: string, isDelete: boolean): Promise<User> {
    if (actingUserId === targetUserId && isDelete) {
      throw new BadRequestException('Kendi hesabınızı silemezsiniz');
    }

    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (isDelete) {
      user.softDelete();
    } else {
      user.restore();
    }
    await this.userRepository.save(user);

    if (isDelete) {
      await this.refreshTokenRepository.revokeAllForUser(targetUserId);
    }

    await this.auditLogService.record({
      actorUserId: actingUserId,
      action: isDelete ? 'USER_DELETED' : 'USER_RESTORED',
      entityType: 'User',
      entityId: targetUserId,
    });

    return user;
  }
}
