export interface AuthEmailParams {
  recipientName: string;
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
}

export function buildAuthEmailHtml(params: AuthEmailParams): string {
  const { recipientName, title, message, ctaLabel, ctaUrl } = params;
  return `
<!DOCTYPE html>
<html lang="tr">
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background:#4f46e5;padding:20px 24px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">Kamu Radar</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px;">
                <p style="margin:0 0 16px;color:#0f172a;font-size:15px;">Merhaba ${recipientName},</p>
                <h1 style="margin:0 0 12px;color:#0f172a;font-size:18px;">${title}</h1>
                <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.5;">${message}</p>
                <a href="${ctaUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:10px;">${ctaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                  Bu e-postayı Kamu Radar hesabınızla ilgili bir işlem nedeniyle alıyorsunuz.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
