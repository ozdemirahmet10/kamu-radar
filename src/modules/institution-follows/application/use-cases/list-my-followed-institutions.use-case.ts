import { Inject, Injectable } from '@nestjs/common';
import {
  IInstitutionFollowRepository,
  INSTITUTION_FOLLOW_REPOSITORY,
  InstitutionFollowRecord,
} from '../../domain/repositories/institution-follow.repository.interface';

@Injectable()
export class ListMyFollowedInstitutionsUseCase {
  constructor(
    @Inject(INSTITUTION_FOLLOW_REPOSITORY)
    private readonly institutionFollowRepository: IInstitutionFollowRepository,
  ) {}

  async execute(userId: string): Promise<InstitutionFollowRecord[]> {
    return this.institutionFollowRepository.listByUser(userId);
  }
}
