import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '@app/config';
import { EMAIL_SENDER, IEmailSender } from '@app/email';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../identity/domain/repositories/user.repository.interface';
import { SupportRequestType } from '../dto/submit-support-request.dto';
import {
  buildSupportRequestEmailHtml,
  SUPPORT_REQUEST_TYPE_LABELS,
} from '../services/support-request-email.template';

@Injectable()
export class SubmitSupportRequestUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
    private readonly configService: AppConfigService,
  ) {}

  async execute(userId: string, type: SupportRequestType, message: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    await this.emailSender.send({
      to: this.configService.support.inboxEmail,
      subject: `Kamu Radar — Yeni ${SUPPORT_REQUEST_TYPE_LABELS[type]}`,
      html: buildSupportRequestEmailHtml({
        senderName: user.fullName,
        senderEmail: user.email.value,
        type,
        message,
      }),
      replyTo: user.email.value,
    });
  }
}
