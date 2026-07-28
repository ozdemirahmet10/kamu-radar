import { Inject, Injectable } from '@nestjs/common';
import {
  IInstitutionFollowRepository,
  INSTITUTION_FOLLOW_REPOSITORY,
} from '../../domain/repositories/institution-follow.repository.interface';

@Injectable()
export class UnfollowInstitutionUseCase {
  constructor(
    @Inject(INSTITUTION_FOLLOW_REPOSITORY)
    private readonly institutionFollowRepository: IInstitutionFollowRepository,
  ) {}

  async execute(userId: string, institutionName: string): Promise<void> {
    await this.institutionFollowRepository.unfollow(userId, institutionName);
  }
}
