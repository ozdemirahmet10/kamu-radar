import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { HASHER_SERVICE, IHasherService } from '../ports/hasher.port';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(HASHER_SERVICE) private readonly hasherService: IHasherService,
  ) {}

  async execute(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const isCurrentPasswordValid = await this.hasherService.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mevcut şifreniz yanlış.');
    }

    const newPasswordHash = await this.hasherService.hash(newPassword);
    user.changePassword(newPasswordHash);
    await this.userRepository.save(user);
  }
}
