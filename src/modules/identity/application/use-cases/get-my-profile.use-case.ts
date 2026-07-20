import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import {
  IUserProfileRepository,
  USER_PROFILE_REPOSITORY,
} from '../../domain/repositories/user-profile.repository.interface';

@Injectable()
export class GetMyProfileUseCase {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY) private readonly profileRepository: IUserProfileRepository,
  ) {}

  async execute(userId: string): Promise<UserProfile> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profil bulunamadı');
    }
    return profile;
  }
}
