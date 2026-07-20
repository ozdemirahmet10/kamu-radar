import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JobPosting } from '../../domain/entities/job-posting.entity';
import { ApplicationWindow } from '../../domain/value-objects/application-window.vo';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../domain/repositories/job-posting.repository.interface';
import { UpdateJobPostingDto } from '../dto/update-job-posting.dto';

@Injectable()
export class UpdateJobPostingUseCase {
  constructor(
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
  ) {}

  async execute(id: string, dto: UpdateJobPostingDto): Promise<JobPosting> {
    const jobPosting = await this.jobPostingRepository.findById(id);
    if (!jobPosting) {
      throw new NotFoundException('İlan bulunamadı');
    }

    const snapshot = jobPosting.snapshot;

    const applicationWindow =
      dto.applicationStartDate !== undefined || dto.applicationEndDate !== undefined
        ? ApplicationWindow.create(
            dto.applicationStartDate
              ? new Date(dto.applicationStartDate)
              : snapshot.applicationWindow.startDate,
            dto.applicationEndDate
              ? new Date(dto.applicationEndDate)
              : snapshot.applicationWindow.endDate,
          )
        : undefined;

    jobPosting.update({
      institutionName: dto.institutionName,
      institutionType: dto.institutionType,
      positionTitle: dto.positionTitle,
      cityId: dto.cityId,
      quotaCount: dto.quotaCount,
      employmentType: dto.employmentType,
      minimumEducationLevel: dto.minimumEducationLevel,
      kpssScoreType: dto.kpssScoreType,
      minKpssScore: dto.minKpssScore,
      minAge: dto.minAge,
      maxAge: dto.maxAge,
      requiresExperience: dto.requiresExperience,
      applicationWindow,
      applicationUrl: dto.applicationUrl,
      description: dto.description,
      qualificationCodes: dto.qualificationCodes?.map((qc) => ({
        code: qc.code,
        description: qc.description ?? null,
      })),
      departments: dto.departments,
    });

    await this.jobPostingRepository.save(jobPosting, 'İlan bilgileri güncellendi');
    return jobPosting;
  }
}
