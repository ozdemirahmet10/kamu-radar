import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '../../domain/entities/user.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { AuditLogService } from '../../../../common/audit/audit-log.service';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(actingUserId: string, targetUserId: string, role: UserRole): Promise<User> {
    if (actingUserId === targetUserId && role !== UserRole.ADMIN) {
      throw new BadRequestException('Kendi admin yetkinizi kaldıramazsınız');
    }

    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const previousRole = user.role;
    user.changeRole(role);
    await this.userRepository.save(user);

    await this.auditLogService.record({
      actorUserId: actingUserId,
      action: 'USER_ROLE_CHANGED',
      entityType: 'User',
      entityId: targetUserId,
      changes: { from: previousRole, to: role },
    });

    return user;
  }
}
