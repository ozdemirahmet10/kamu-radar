export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface IEmailSender {
  send(params: SendEmailParams): Promise<void>;
}
