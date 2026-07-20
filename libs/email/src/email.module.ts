import { Module } from '@nestjs/common';
import { EMAIL_SENDER } from './email-sender.port';
import { NodemailerEmailSender } from './nodemailer-email-sender.service';

@Module({
  providers: [{ provide: EMAIL_SENDER, useClass: NodemailerEmailSender }],
  exports: [EMAIL_SENDER],
})
export class EmailModule {}
