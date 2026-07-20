import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JobPosting, JobPostingStatus } from '../../domain/entities/job-posting.entity';
import { ApplicationWindow } from '../../domain/value-objects/application-window.vo';
import { JobPostingFingerprint } from '../../domain/value-objects/job-posting-fingerprint.vo';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../domain/repositories/job-posting.repository.interface';
import { CITY_RESOLVER, ICityResolver } from '../ports/city-resolver.port';
import { ExtractedJobPostingData } from '../ports/extracted-job-posting-data';

const AUTO_PUBLISH_CONFIDENCE_THRESHOLD = 0.75;

export interface UpsertJobPostingFromCrawlResult {
  jobPosting: JobPosting;
  wasCreated: boolean;
}

@Injectable()
export class UpsertJobPostingFromCrawlUseCase {
  constructor(
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
    @Inject(CITY_RESOLVER) private readonly cityResolver: ICityResolver,
  ) {}

  async execute(
    sourceId: string,
    externalRef: string,
    data: ExtractedJobPostingData,
    pdfStorageKey: string | null = null,
  ): Promise<UpsertJobPostingFromCrawlResult> {
    const cityId = data.cityName ? await this.cityResolver.resolveByName(data.cityName) : null;
    const applicationWindow = ApplicationWindow.create(
      data.applicationStartDate,
      data.applicationEndDate,
    );

    const fingerprint = JobPostingFingerprint.compute({
      institutionName: data.institutionName,
      positionTitle: data.positionTitle,
      cityId,
      applicationStartDate: applicationWindow.startDate,
    });

    // Kaynak içi tekilleştirme için önce externalRef'e (crawler'ın kendi ilan kimliği,
    // örn. sitedeki 'kod' parametresi) bakılır — bu, LLM'in aynı ilanı iki farklı
    // taramada biraz farklı kelimelerle özetleyip fingerprint'i değiştirmesi durumunda
    // mükerrer kayıt oluşmasını önler. Fingerprint eşleşmesi yalnızca externalRef
    // bulunamazsa (örn. farklı kaynaklarda yayınlanan aynı ilan) devreye girer.
    const existing =
      (await this.jobPostingRepository.findBySourceAndExternalRef(sourceId, externalRef)) ??
      (await this.jobPostingRepository.findByFingerprint(fingerprint.value));

    if (existing) {
      existing.update({
        institutionName: data.institutionName,
        institutionType: data.institutionType,
        positionTitle: data.positionTitle,
        cityId,
        quotaCount: data.quotaCount,
        employmentType: data.employmentType,
        minimumEducationLevel: data.minimumEducationLevel,
        kpssScoreType: data.kpssScoreType,
        minKpssScore: data.minKpssScore,
        minAge: data.minAge,
        maxAge: data.maxAge,
        requiresExperience: data.requiresExperience,
        applicationWindow,
        applicationUrl: data.applicationUrl,
        description: data.description,
        qualificationCodes: data.qualificationCodes,
        departments: data.departments,
      });
      if (pdfStorageKey) {
        existing.setPdfStorageKey(pdfStorageKey);
      }
      await this.jobPostingRepository.save(existing, 'Crawler güncellemesi');
      return { jobPosting: existing, wasCreated: false };
    }

    const status =
      data.confidence >= AUTO_PUBLISH_CONFIDENCE_THRESHOLD
        ? JobPostingStatus.PUBLISHED
        : JobPostingStatus.PENDING_REVIEW;

    const jobPosting = JobPosting.create(
      randomUUID(),
      {
        sourceId,
        externalRef,
        institutionName: data.institutionName,
        institutionType: data.institutionType,
        positionTitle: data.positionTitle,
        cityId,
        quotaCount: data.quotaCount,
        employmentType: data.employmentType,
        minimumEducationLevel: data.minimumEducationLevel,
        kpssScoreType: data.kpssScoreType,
        minKpssScore: data.minKpssScore,
        minAge: data.minAge,
        maxAge: data.maxAge,
        requiresExperience: data.requiresExperience,
        applicationWindow,
        applicationUrl: data.applicationUrl,
        description: data.description,
        pdfStorageKey,
        qualificationCodes: data.qualificationCodes,
        departments: data.departments,
      },
      status,
    );

    await this.jobPostingRepository.save(jobPosting);
    return { jobPosting, wasCreated: true };
  }
}
