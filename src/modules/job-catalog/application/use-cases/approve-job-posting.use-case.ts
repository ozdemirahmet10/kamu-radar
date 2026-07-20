import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JobPosting } from '../../domain/entities/job-posting.entity';
import {
  IJobPostingRepository,
  JOB_POSTING_REPOSITORY,
} from '../../domain/repositories/job-posting.repository.interface';
import { AuditLogService } from '../../../../common/audit/audit-log.service';

@Injectable()
export class ApproveJobPostingUseCase {
  constructor(
    @Inject(JOB_POSTING_REPOSITORY) private readonly jobPostingRepository: IJobPostingRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async execute(id: string, actingUserId: string | null = null): Promise<JobPosting> {
    const jobPosting = await this.jobPostingRepository.findById(id);
    if (!jobPosting) {
      throw new NotFoundException('İlan bulunamadı');
    }

    jobPosting.publish();
    await this.jobPostingRepository.save(jobPosting, 'Moderasyon onayı sonrası yayınlandı');

    await this.auditLogService.record({
      actorUserId: actingUserId,
      action: 'JOB_POSTING_APPROVED',
      entityType: 'JobPosting',
      entityId: id,
    });

    return jobPosting;
  }
}
