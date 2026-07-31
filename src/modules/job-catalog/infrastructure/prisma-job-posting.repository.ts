import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@app/database';
import {
  EducationLevel,
  EmploymentType,
  InstitutionType,
  JobPosting,
  JobPostingStatus,
} from '../domain/entities/job-posting.entity';
import { ApplicationWindow } from '../domain/value-objects/application-window.vo';
import { JobPostingFingerprint } from '../domain/value-objects/job-posting-fingerprint.vo';
import {
  IJobPostingRepository,
  InstitutionAggregationRow,
  ListJobPostingsFilter,
  ListJobPostingsResult,
  RecentInstitutionPostingRow,
} from '../domain/repositories/job-posting.repository.interface';

type JobPostingWithRelations = Prisma.JobPostingGetPayload<{
  include: { qualificationCodes: true; departments: true };
}>;

const INCLUDE = { qualificationCodes: true, departments: true } satisfies Prisma.JobPostingInclude;

@Injectable()
export class PrismaJobPostingRepository implements IJobPostingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<JobPosting | null> {
    const record = await this.prisma.jobPosting.findUnique({ where: { id }, include: INCLUDE });
    return record ? this.toDomain(record) : null;
  }

  async findByIds(ids: string[]): Promise<JobPosting[]> {
    if (ids.length === 0) return [];
    const records = await this.prisma.jobPosting.findMany({
      where: { id: { in: ids } },
      include: INCLUDE,
    });
    return records.map((record) => this.toDomain(record));
  }

  async findBySourceAndExternalRef(
    sourceId: string,
    externalRef: string,
  ): Promise<JobPosting | null> {
    const record = await this.prisma.jobPosting.findFirst({
      where: { sourceId, externalRef },
      include: INCLUDE,
    });
    return record ? this.toDomain(record) : null;
  }

  async findByFingerprint(fingerprintValue: string): Promise<JobPosting | null> {
    const record = await this.prisma.jobPosting.findUnique({
      where: { fingerprintHash: fingerprintValue },
      include: INCLUDE,
    });
    return record ? this.toDomain(record) : null;
  }

  async list(filter: ListJobPostingsFilter): Promise<ListJobPostingsResult> {
    // Tek bir düz nesne yerine AND dizisi kullanılıyor — hem KPSS puan aralığı hem de
    // anahtar kelime filtresi kendi OR koşuluna ihtiyaç duyabiliyor; ikisi de aynı anda
    // aktifken tek bir nesnede iki "OR" alanı olamayacağından (biri diğerini ezer) her
    // koşul ayrı bir AND öğesi olarak eklenir.
    const andConditions: Prisma.JobPostingWhereInput[] = [];

    if (filter.cityId) andConditions.push({ cityId: filter.cityId });
    if (filter.kpssScoreType) andConditions.push({ kpssScoreType: filter.kpssScoreType });
    if (filter.institutionType) andConditions.push({ institutionType: filter.institutionType });
    if (filter.employmentType) andConditions.push({ employmentType: filter.employmentType });
    if (filter.minimumEducationLevel) {
      andConditions.push({ minimumEducationLevel: filter.minimumEducationLevel });
    }
    if (filter.minKpssScore !== undefined || filter.maxKpssScore !== undefined) {
      // minKpssScore NULL olan ilanlar (KPSS puan şartı belirtilmemiş) aralık filtresinden
      // her zaman muaf tutulur — NULL karşılaştırmaları SQL'de asla "doğru" sayılmadığından,
      // bu istisna olmadan puan şartı olmayan ilanlar her aramada sessizce kaybolurdu.
      andConditions.push({
        OR: [
          { minKpssScore: null },
          {
            minKpssScore: {
              ...(filter.minKpssScore !== undefined ? { gte: filter.minKpssScore } : {}),
              ...(filter.maxKpssScore !== undefined ? { lte: filter.maxKpssScore } : {}),
            },
          },
        ],
      });
    }
    if (filter.statuses) andConditions.push({ status: { in: filter.statuses } });
    if (filter.hasPdf) andConditions.push({ pdfStorageKey: { not: null } });
    if (filter.createdAfter) andConditions.push({ createdAt: { gte: filter.createdAfter } });
    if (filter.deadlineWithinDays !== undefined) {
      const now = new Date();
      const until = new Date(now.getTime() + filter.deadlineWithinDays * 24 * 60 * 60 * 1000);
      andConditions.push({ applicationEndDate: { gte: now, lte: until } });
    }
    if (filter.keyword) {
      andConditions.push({
        OR: [
          { institutionName: { contains: filter.keyword, mode: 'insensitive' } },
          { positionTitle: { contains: filter.keyword, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.JobPostingWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const [records, totalCount] = await this.prisma.$transaction([
      this.prisma.jobPosting.findMany({
        where,
        include: INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toDomain(record)),
      page: filter.page,
      pageSize: filter.pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / filter.pageSize)),
    };
  }

  async save(jobPosting: JobPosting, versionChangeReason?: string): Promise<void> {
    const snapshot = jobPosting.snapshot;

    await this.prisma.$transaction(async (tx) => {
      await tx.jobPosting.upsert({
        where: { id: jobPosting.id },
        create: {
          id: jobPosting.id,
          sourceId: snapshot.sourceId,
          externalRef: snapshot.externalRef,
          fingerprintHash: snapshot.fingerprint.value,
          institutionName: snapshot.institutionName,
          institutionType: snapshot.institutionType,
          positionTitle: snapshot.positionTitle,
          cityId: snapshot.cityId,
          quotaCount: snapshot.quotaCount,
          employmentType: snapshot.employmentType,
          minimumEducationLevel: snapshot.minimumEducationLevel,
          kpssScoreType: snapshot.kpssScoreType,
          minKpssScore: snapshot.minKpssScore,
          minAge: snapshot.minAge,
          maxAge: snapshot.maxAge,
          requiresExperience: snapshot.requiresExperience,
          applicationStartDate: snapshot.applicationWindow.startDate,
          applicationEndDate: snapshot.applicationWindow.endDate,
          applicationUrl: snapshot.applicationUrl,
          description: snapshot.description,
          pdfStorageKey: snapshot.pdfStorageKey,
          status: snapshot.status,
        },
        update: {
          fingerprintHash: snapshot.fingerprint.value,
          institutionName: snapshot.institutionName,
          institutionType: snapshot.institutionType,
          positionTitle: snapshot.positionTitle,
          cityId: snapshot.cityId,
          quotaCount: snapshot.quotaCount,
          employmentType: snapshot.employmentType,
          minimumEducationLevel: snapshot.minimumEducationLevel,
          kpssScoreType: snapshot.kpssScoreType,
          minKpssScore: snapshot.minKpssScore,
          minAge: snapshot.minAge,
          maxAge: snapshot.maxAge,
          requiresExperience: snapshot.requiresExperience,
          applicationStartDate: snapshot.applicationWindow.startDate,
          applicationEndDate: snapshot.applicationWindow.endDate,
          applicationUrl: snapshot.applicationUrl,
          description: snapshot.description,
          pdfStorageKey: snapshot.pdfStorageKey,
          status: snapshot.status,
        },
      });

      await tx.jobPostingQualificationCode.deleteMany({ where: { jobPostingId: jobPosting.id } });
      if (snapshot.qualificationCodes.length > 0) {
        await tx.jobPostingQualificationCode.createMany({
          data: snapshot.qualificationCodes.map((qc) => ({
            jobPostingId: jobPosting.id,
            code: qc.code,
            description: qc.description,
          })),
        });
      }

      await tx.jobPostingDepartment.deleteMany({ where: { jobPostingId: jobPosting.id } });
      if (snapshot.departments.length > 0) {
        await tx.jobPostingDepartment.createMany({
          data: snapshot.departments.map((departmentName) => ({
            jobPostingId: jobPosting.id,
            departmentName,
          })),
        });
      }

      if (versionChangeReason) {
        await tx.jobPostingVersion.create({
          data: {
            jobPostingId: jobPosting.id,
            snapshot: {
              institutionName: snapshot.institutionName,
              institutionType: snapshot.institutionType,
              positionTitle: snapshot.positionTitle,
              cityId: snapshot.cityId,
              quotaCount: snapshot.quotaCount,
              employmentType: snapshot.employmentType,
              minimumEducationLevel: snapshot.minimumEducationLevel,
              kpssScoreType: snapshot.kpssScoreType,
              minKpssScore: snapshot.minKpssScore,
              minAge: snapshot.minAge,
              maxAge: snapshot.maxAge,
              requiresExperience: snapshot.requiresExperience,
              applicationStartDate: snapshot.applicationWindow.startDate?.toISOString() ?? null,
              applicationEndDate: snapshot.applicationWindow.endDate?.toISOString() ?? null,
              applicationUrl: snapshot.applicationUrl,
              description: snapshot.description,
              status: snapshot.status,
            },
            changeReason: versionChangeReason,
          },
        });
      }
    });
  }

  async findExpiredWithPdf(referenceDate: Date): Promise<JobPosting[]> {
    const records = await this.prisma.jobPosting.findMany({
      where: {
        pdfStorageKey: { not: null },
        applicationEndDate: { lt: referenceDate },
      },
      include: INCLUDE,
    });
    return records.map((record) => this.toDomain(record));
  }

  async findPublishedWithPastDeadline(referenceDate: Date): Promise<JobPosting[]> {
    const records = await this.prisma.jobPosting.findMany({
      where: {
        status: 'PUBLISHED',
        applicationEndDate: { lt: referenceDate },
      },
      include: INCLUDE,
    });
    return records.map((record) => this.toDomain(record));
  }

  async findActiveForInstitutionAggregation(
    referenceDate: Date,
  ): Promise<InstitutionAggregationRow[]> {
    const records = await this.prisma.jobPosting.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ applicationEndDate: null }, { applicationEndDate: { gte: referenceDate } }],
      },
      select: {
        institutionName: true,
        institutionType: true,
        cityId: true,
        quotaCount: true,
        applicationEndDate: true,
      },
    });
    return records.map((record) => ({
      institutionName: record.institutionName,
      institutionType: record.institutionType as InstitutionType | null,
      cityId: record.cityId,
      quotaCount: record.quotaCount,
      applicationEndDate: record.applicationEndDate,
    }));
  }

  async findRecentByInstitutionNames(
    institutionNames: string[],
    since: Date,
  ): Promise<RecentInstitutionPostingRow[]> {
    if (institutionNames.length === 0) return [];
    return this.prisma.jobPosting.findMany({
      where: {
        institutionName: { in: institutionNames },
        status: 'PUBLISHED',
        createdAt: { gte: since },
      },
      select: { id: true, institutionName: true, positionTitle: true, createdAt: true },
    });
  }

  private toDomain(record: JobPostingWithRelations): JobPosting {
    return JobPosting.reconstitute(record.id, {
      sourceId: record.sourceId,
      externalRef: record.externalRef,
      fingerprint: JobPostingFingerprint.fromExisting(record.fingerprintHash),
      institutionName: record.institutionName,
      institutionType: record.institutionType as InstitutionType | null,
      positionTitle: record.positionTitle,
      cityId: record.cityId,
      quotaCount: record.quotaCount,
      employmentType: record.employmentType as EmploymentType | null,
      minimumEducationLevel: record.minimumEducationLevel as EducationLevel | null,
      kpssScoreType: record.kpssScoreType,
      minKpssScore: record.minKpssScore,
      minAge: record.minAge,
      maxAge: record.maxAge,
      requiresExperience: record.requiresExperience,
      applicationWindow: ApplicationWindow.create(
        record.applicationStartDate,
        record.applicationEndDate,
      ),
      applicationUrl: record.applicationUrl,
      description: record.description,
      pdfStorageKey: record.pdfStorageKey,
      status: record.status as JobPostingStatus,
      qualificationCodes: record.qualificationCodes.map((qc) => ({
        code: qc.code,
        description: qc.description,
      })),
      departments: record.departments.map((d) => d.departmentName),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
