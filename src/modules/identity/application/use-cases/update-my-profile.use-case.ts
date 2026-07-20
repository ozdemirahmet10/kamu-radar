import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import { KpssScore } from '../../domain/value-objects/kpss-score.vo';
import {
  IUserProfileRepository,
  USER_PROFILE_REPOSITORY,
} from '../../domain/repositories/user-profile.repository.interface';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY) private readonly profileRepository: IUserProfileRepository,
  ) {}

  async execute(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profil bulunamadı');
    }

    if (dto.birthDate !== undefined) {
      profile.updateBirthDate(new Date(dto.birthDate));
    }

    if (dto.educationLevel !== undefined) {
      profile.updateEducationLevel(dto.educationLevel);
    }

    if (dto.graduationSchool !== undefined || dto.graduationDepartmentId !== undefined) {
      profile.updateEducation(
        dto.graduationSchool ?? profile.snapshot.graduationSchool,
        dto.graduationDepartmentId ?? profile.snapshot.graduationDepartmentId,
      );
    }

    if (dto.kpssScoreType && dto.kpssScore !== undefined && dto.kpssYear) {
      profile.updateKpssScore(KpssScore.create(dto.kpssScoreType, dto.kpssScore, dto.kpssYear));
    }

    if (dto.drivingLicense !== undefined) {
      profile.updateDrivingLicense(dto.drivingLicense);
    }

    if (dto.ydsScore !== undefined || dto.ydsType !== undefined) {
      profile.updateYds(
        dto.ydsScore ?? profile.snapshot.ydsScore,
        dto.ydsType ?? profile.snapshot.ydsType,
      );
    }

    if (dto.militaryStatus) {
      profile.updateMilitaryStatus(dto.militaryStatus);
    }

    if (dto.disabilityStatus) {
      profile.updateDisabilityStatus(dto.disabilityStatus);
    }

    if (dto.certificates) {
      profile.updateCertificates(dto.certificates);
    }

    if (dto.preferredCityIds) {
      profile.updatePreferredCities(dto.preferredCityIds);
    }

    await this.profileRepository.save(profile);
    return profile;
  }
}
