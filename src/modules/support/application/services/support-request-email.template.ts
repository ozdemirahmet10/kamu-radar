import { SupportRequestType } from '../dto/submit-support-request.dto';

export const SUPPORT_REQUEST_TYPE_LABELS: Record<SupportRequestType, string> = {
  [SupportRequestType.GORUS]: 'Görüş',
  [SupportRequestType.TALEP]: 'Talep',
  [SupportRequestType.ONERI]: 'Öneri',
};

export interface SupportRequestEmailParams {
  senderName: string;
  senderEmail: string;
  type: SupportRequestType;
  message: string;
}

export function buildSupportRequestEmailHtml(params: SupportRequestEmailParams): string {
  const { senderName, senderEmail, type, message } = params;
  const typeLabel = SUPPORT_REQUEST_TYPE_LABELS[type];
  const escapedMessage = message.replace(/\n/g, '<br/>');

  return `
<!DOCTYPE html>
<html lang="tr">
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background:#4f46e5;padding:20px 24px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">Kamu Radar — Yeni ${typeLabel}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px;">
                <p style="margin:0 0 4px;color:#0f172a;font-size:14px;"><strong>Gönderen:</strong> ${senderName}</p>
                <p style="margin:0 0 16px;color:#0f172a;font-size:14px;"><strong>E-posta:</strong> ${senderEmail}</p>
                <div style="margin-top:16px;padding:16px;background:#f8fafc;border-radius:10px;color:#334155;font-size:14px;line-height:1.6;">
                  ${escapedMessage}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
