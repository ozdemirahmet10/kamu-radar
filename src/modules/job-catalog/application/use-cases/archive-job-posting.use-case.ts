import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../domain/repositories/job-posting.repository.interface';
import { AuditLogService } from '../../../../common/audit/audit-log.service';

@Injectable()
export class ArchiveJobPostingUseCase {
  constructor(
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(id: string, actingUserId: string | null = null): Promise<void> {
    const jobPosting = await this.jobPostingRepository.findById(id);
    if (!jobPosting) {
      throw new NotFoundException('İlan bulunamadı');
    }

    jobPosting.archive();
    await this.jobPostingRepository.save(jobPosting, 'İlan arşivlendi');

    await this.auditLogService.record({
      actorUserId: actingUserId,
      action: 'JOB_POSTING_ARCHIVED',
      entityType: 'JobPosting',
      entityId: id,
    });
  }
}
