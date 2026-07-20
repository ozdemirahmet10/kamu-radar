import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JobPosting } from '../../domain/entities/job-posting.entity';
import { ApplicationWindow } from '../../domain/value-objects/application-window.vo';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../domain/repositories/job-posting.repository.interface';
import { ISourceResolver, SOURCE_RESOLVER } from '../ports/source-resolver.port';
import { CreateJobPostingDto } from '../dto/create-job-posting.dto';
import { JobPostingFingerprint } from '../../domain/value-objects/job-posting-fingerprint.vo';

@Injectable()
export class CreateJobPostingUseCase {
  constructor(
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
    @Inject(SOURCE_RESOLVER) private readonly sourceResolver: ISourceResolver,
  ) {}

  async execute(dto: CreateJobPostingDto): Promise<JobPosting> {
    const applicationWindow = ApplicationWindow.create(
      dto.applicationStartDate ? new Date(dto.applicationStartDate) : null,
      dto.applicationEndDate ? new Date(dto.applicationEndDate) : null,
    );

    const fingerprint = JobPostingFingerprint.compute({
      institutionName: dto.institutionName,
      positionTitle: dto.positionTitle,
      cityId: dto.cityId ?? null,
      applicationStartDate: applicationWindow.startDate,
    });

    const existing = await this.jobPostingRepository.findByFingerprint(fingerprint.value);
    if (existing) {
      throw new ConflictException(
        'Aynı kurum, kadro, şehir ve başlangıç tarihine sahip bir ilan zaten kayıtlı',
      );
    }

    const sourceId = await this.sourceResolver.getManualEntrySourceId();

    const jobPosting = JobPosting.create(randomUUID(), {
      sourceId,
      externalRef: null,
      institutionName: dto.institutionName,
      institutionType: dto.institutionType ?? null,
      positionTitle: dto.positionTitle,
      cityId: dto.cityId ?? null,
      quotaCount: dto.quotaCount ?? null,
      employmentType: dto.employmentType ?? null,
      minimumEducationLevel: dto.minimumEducationLevel ?? null,
      kpssScoreType: dto.kpssScoreType ?? null,
      minKpssScore: dto.minKpssScore ?? null,
      minAge: dto.minAge ?? null,
      maxAge: dto.maxAge ?? null,
      requiresExperience: dto.requiresExperience ?? false,
      applicationWindow,
      applicationUrl: dto.applicationUrl ?? null,
      description: dto.description ?? null,
      pdfStorageKey: null,
      qualificationCodes: (dto.qualificationCodes ?? []).map((qc) => ({
        code: qc.code,
        description: qc.description ?? null,
      })),
      departments: dto.departments ?? [],
    });

    await this.jobPostingRepository.save(jobPosting);
    return jobPosting;
  }
}
