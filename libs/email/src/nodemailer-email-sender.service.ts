import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { AppConfigService } from '@app/config';
import { IEmailSender, SendEmailParams } from './email-sender.port';

@Injectable()
export class NodemailerEmailSender implements IEmailSender, OnModuleInit {
  private readonly logger = new Logger(NodemailerEmailSender.name);
  private transporter!: Transporter;
  private fromAddress!: string;

  constructor(private readonly configService: AppConfigService) {}

  onModuleInit(): void {
    const { from, smtp } = this.configService.email;
    this.fromAddress = from;
    this.transporter = createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: false,
      auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
    });
  }

  async send(params: SendEmailParams): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: params.to,
        subject: params.subject,
        html: params.html,
        replyTo: params.replyTo,
      });
    } catch (error) {
      // E-posta gönderimi çağıran akışı asla bloklamamalı — e-posta her zaman
      // asıl işlemin (bildirim, kayıt, şifre sıfırlama) yanında ek bir kanaldır.
      this.logger.warn(`E-posta gönderilemedi (${params.to}): ${(error as Error).message}`);
    }
  }
}
