import { Entity, EducationLevel } from '@app/shared-kernel';
import { KpssScore } from '../value-objects/kpss-score.vo';

export { EducationLevel };

export enum MilitaryStatus {
  YAPILDI = 'YAPILDI',
  MUAF = 'MUAF',
  TECILLI = 'TECILLI',
  YOK = 'YOK',
}

export enum DisabilityStatus {
  YOK = 'YOK',
  VAR = 'VAR',
}

export interface UserProfileProps {
  userId: string;
  birthDate: Date | null;
  educationLevel: EducationLevel | null;
  graduationSchool: string | null;
  graduationDepartmentId: string | null;
  kpssScore: KpssScore | null;
  drivingLicense: boolean;
  ydsScore: number | null;
  ydsType: string | null;
  militaryStatus: MilitaryStatus | null;
  disabilityStatus: DisabilityStatus;
  certificates: string[];
  preferredCityIds: string[];
}

export class UserProfile extends Entity<string> {
  private constructor(
    id: string,
    private props: UserProfileProps,
  ) {
    super(id);
  }

  static createEmpty(id: string, userId: string): UserProfile {
    return new UserProfile(id, {
      userId,
      birthDate: null,
      educationLevel: null,
      graduationSchool: null,
      graduationDepartmentId: null,
      kpssScore: null,
      drivingLicense: false,
      ydsScore: null,
      ydsType: null,
      militaryStatus: null,
      disabilityStatus: DisabilityStatus.YOK,
      certificates: [],
      preferredCityIds: [],
    });
  }

  static reconstitute(id: string, props: UserProfileProps): UserProfile {
    return new UserProfile(id, props);
  }

  get userId(): string {
    return this.props.userId;
  }

  get snapshot(): UserProfileProps {
    return { ...this.props };
  }

  updateEducation(school: string | null, departmentId: string | null): void {
    this.props.graduationSchool = school;
    this.props.graduationDepartmentId = departmentId;
  }

  updateBirthDate(birthDate: Date | null): void {
    this.props.birthDate = birthDate;
  }

  updateEducationLevel(educationLevel: EducationLevel | null): void {
    this.props.educationLevel = educationLevel;
  }

  updateKpssScore(kpssScore: KpssScore | null): void {
    this.props.kpssScore = kpssScore;
  }

  updateDrivingLicense(hasLicense: boolean): void {
    this.props.drivingLicense = hasLicense;
  }

  updateYds(score: number | null, type: string | null): void {
    this.props.ydsScore = score;
    this.props.ydsType = type;
  }

  updateMilitaryStatus(status: MilitaryStatus | null): void {
    this.props.militaryStatus = status;
  }

  updateDisabilityStatus(status: DisabilityStatus): void {
    this.props.disabilityStatus = status;
  }

  updatePreferredCities(cityIds: string[]): void {
    this.props.preferredCityIds = [...new Set(cityIds)];
  }

  updateCertificates(certificates: string[]): void {
    this.props.certificates = [...certificates];
  }
}
