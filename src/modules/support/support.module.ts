import { Module } from '@nestjs/common';
import { EmailModule } from '@app/email';
import { IdentityModule } from '../identity/identity.module';

import { SubmitSupportRequestUseCase } from './application/use-cases/submit-support-request.use-case';
import { MeSupportController } from './presentation/controllers/me-support.controller';

@Module({
  imports: [IdentityModule, EmailModule],
  controllers: [MeSupportController],
  providers: [SubmitSupportRequestUseCase],
})
export class SupportModule {}
