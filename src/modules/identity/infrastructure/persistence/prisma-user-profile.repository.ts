import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@app/database';
import {
  DisabilityStatus,
  EducationLevel,
  MilitaryStatus,
  UserProfile,
} from '../../domain/entities/user-profile.entity';
import { KpssScore } from '../../domain/value-objects/kpss-score.vo';
import { IUserProfileRepository } from '../../domain/repositories/user-profile.repository.interface';

type ProfileWithRelations = Prisma.UserProfileGetPayload<{
  include: { certificates: true; preferredCities: true };
}>;

@Injectable()
export class PrismaUserProfileRepository implements IUserProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserProfile | null> {
    const record = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { certificates: true, preferredCities: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async save(profile: UserProfile): Promise<void> {
    const snapshot = profile.snapshot;

    await this.prisma.$transaction(async (tx) => {
      await tx.userProfile.upsert({
        where: { userId: snapshot.userId },
        create: {
          id: profile.id,
          userId: snapshot.userId,
          birthDate: snapshot.birthDate,
          educationLevel: snapshot.educationLevel,
          graduationSchool: snapshot.graduationSchool,
          graduationDepartmentId: snapshot.graduationDepartmentId,
          kpssScoreType: snapshot.kpssScore?.scoreType ?? null,
          kpssScore: snapshot.kpssScore?.score ?? null,
          kpssYear: snapshot.kpssScore?.year ?? null,
          drivingLicense: snapshot.drivingLicense,
          ydsScore: snapshot.ydsScore,
          ydsType: snapshot.ydsType,
          militaryStatus: snapshot.militaryStatus,
          disabilityStatus: snapshot.disabilityStatus,
        },
        update: {
          birthDate: snapshot.birthDate,
          educationLevel: snapshot.educationLevel,
          graduationSchool: snapshot.graduationSchool,
          graduationDepartmentId: snapshot.graduationDepartmentId,
          kpssScoreType: snapshot.kpssScore?.scoreType ?? null,
          kpssScore: snapshot.kpssScore?.score ?? null,
          kpssYear: snapshot.kpssScore?.year ?? null,
          drivingLicense: snapshot.drivingLicense,
          ydsScore: snapshot.ydsScore,
          ydsType: snapshot.ydsType,
          militaryStatus: snapshot.militaryStatus,
          disabilityStatus: snapshot.disabilityStatus,
        },
      });

      await tx.userCertificate.deleteMany({ where: { userProfileId: profile.id } });
      if (snapshot.certificates.length > 0) {
        await tx.userCertificate.createMany({
          data: snapshot.certificates.map((certificateName) => ({
            userProfileId: profile.id,
            certificateName,
          })),
        });
      }

      await tx.userPreferredCity.deleteMany({ where: { userProfileId: profile.id } });
      if (snapshot.preferredCityIds.length > 0) {
        await tx.userPreferredCity.createMany({
          data: snapshot.preferredCityIds.map((cityId) => ({
            userProfileId: profile.id,
            cityId,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  private toDomain(record: ProfileWithRelations): UserProfile {
    return UserProfile.reconstitute(record.id, {
      userId: record.userId,
      birthDate: record.birthDate,
      educationLevel: record.educationLevel as EducationLevel | null,
      graduationSchool: record.graduationSchool,
      graduationDepartmentId: record.graduationDepartmentId,
      kpssScore:
        record.kpssScoreType && record.kpssScore !== null && record.kpssYear
          ? KpssScore.create(record.kpssScoreType, record.kpssScore, record.kpssYear)
          : null,
      drivingLicense: record.drivingLicense,
      ydsScore: record.ydsScore,
      ydsType: record.ydsType,
      militaryStatus: record.militaryStatus as MilitaryStatus | null,
      disabilityStatus: (record.disabilityStatus as DisabilityStatus) ?? DisabilityStatus.YOK,
      certificates: record.certificates.map((c) => c.certificateName),
      preferredCityIds: record.preferredCities.map((c) => c.cityId),
    });
  }
}
