import { OmitType } from '@nestjs/swagger';
import { ListJobPostingsQueryDto } from './list-job-postings-query.dto';

export class PublicListJobPostingsQueryDto extends OmitType(ListJobPostingsQueryDto, [
  'scope',
] as const) {}
