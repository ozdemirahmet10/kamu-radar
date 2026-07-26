import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { HASHER_SERVICE, IHasherService } from '../ports/hasher.port';
import { AuditLogService } from '../../../../common/audit/audit-log.service';

@Injectable()
export class DeleteMyAccountUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(HASHER_SERVICE) private readonly hasherService: IHasherService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(userId: string, password: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const passwordMatches = await this.hasherService.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new BadRequestException('Şifreniz yanlış.');
    }

    user.softDelete();
    await this.userRepository.save(user);
    // JwtStrategy her istekte isDeleted kontrolü yaptığından, mevcut erişim jetonu
    // süresi dolmadan da bir sonraki istekte geçersiz sayılacak — yine de refresh
    // token'ları da iptal ediyoruz ki kullanıcı yeni bir erişim jetonu alamasın.
    await this.refreshTokenRepository.revokeAllForUser(userId);

    await this.auditLogService.record({
      actorUserId: userId,
      action: 'ACCOUNT_DELETED',
      entityType: 'USER',
      entityId: userId,
    });
  }
}
