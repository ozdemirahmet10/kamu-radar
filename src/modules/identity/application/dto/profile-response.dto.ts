import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import { QualificationCodeMatch } from '../services/qualification-code.service';

export class ProfileResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty({ nullable: true })
  birthDate!: string | null;

  @ApiProperty({ nullable: true })
  educationLevel!: string | null;

  @ApiProperty({ nullable: true })
  graduationSchool!: string | null;

  @ApiProperty({ nullable: true })
  graduationDepartmentId!: string | null;

  @ApiProperty({ nullable: true })
  graduationDepartmentName!: string | null;

  @ApiProperty({ type: [Object] })
  qualificationCodes!: QualificationCodeMatch[];

  @ApiProperty({ nullable: true })
  kpssScoreType!: string | null;

  @ApiProperty({ nullable: true })
  kpssScore!: number | null;

  @ApiProperty({ nullable: true })
  kpssYear!: number | null;

  @ApiProperty()
  drivingLicense!: boolean;

  @ApiProperty({ nullable: true })
  ydsScore!: number | null;

  @ApiProperty({ nullable: true })
  ydsType!: string | null;

  @ApiProperty({ nullable: true })
  militaryStatus!: string | null;

  @ApiProperty()
  disabilityStatus!: string;

  @ApiProperty({ type: [String] })
  certificates!: string[];

  @ApiProperty({ type: [String] })
  preferredCityIds!: string[];

  static fromDomain(
    profile: UserProfile,
    graduationDepartmentName: string | null = null,
    qualificationCodes: QualificationCodeMatch[] = [],
  ): ProfileResponseDto {
    const snapshot = profile.snapshot;
    const dto = new ProfileResponseDto();
    dto.userId = snapshot.userId;
    dto.birthDate = snapshot.birthDate ? snapshot.birthDate.toISOString().slice(0, 10) : null;
    dto.educationLevel = snapshot.educationLevel;
    dto.graduationSchool = snapshot.graduationSchool;
    dto.graduationDepartmentId = snapshot.graduationDepartmentId;
    dto.graduationDepartmentName = graduationDepartmentName;
    dto.qualificationCodes = qualificationCodes;
    dto.kpssScoreType = snapshot.kpssScore?.scoreType ?? null;
    dto.kpssScore = snapshot.kpssScore?.score ?? null;
    dto.kpssYear = snapshot.kpssScore?.year ?? null;
    dto.drivingLicense = snapshot.drivingLicense;
    dto.ydsScore = snapshot.ydsScore;
    dto.ydsType = snapshot.ydsType;
    dto.militaryStatus = snapshot.militaryStatus;
    dto.disabilityStatus = snapshot.disabilityStatus;
    dto.certificates = snapshot.certificates;
    dto.preferredCityIds = snapshot.preferredCityIds;
    return dto;
  }
}
