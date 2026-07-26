export interface NotificationEmailParams {
  recipientName: string;
  title: string;
  message: string;
  ctaUrl: string;
}

export function buildNotificationEmailHtml(params: NotificationEmailParams): string {
  const { recipientName, title, message, ctaUrl } = params;
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
                <a href="${ctaUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:10px;">Detayları Görüntüle</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                  Bu e-postayı Kamu Radar bildirim tercihleriniz açık olduğu için alıyorsunuz.
                  Ayarlar sayfasından e-posta bildirimlerini kapatabilirsiniz.
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

export interface DigestEmailItem {
  title: string;
  message: string;
  ctaUrl: string;
}

export interface DigestEmailParams {
  recipientName: string;
  items: DigestEmailItem[];
  dashboardUrl: string;
}

export function buildDailyDigestEmailHtml(params: DigestEmailParams): string {
  const { recipientName, items, dashboardUrl } = params;
  const rows = items
    .map(
      (item) => `
            <tr>
              <td style="padding:16px 24px;border-top:1px solid #e2e8f0;">
                <h2 style="margin:0 0 6px;color:#0f172a;font-size:15px;">${item.title}</h2>
                <p style="margin:0 0 10px;color:#475569;font-size:14px;line-height:1.5;">${item.message}</p>
                <a href="${item.ctaUrl}" style="color:#4f46e5;text-decoration:none;font-size:13px;font-weight:600;">Detayları Görüntüle →</a>
              </td>
            </tr>`,
    )
    .join('');

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
                <p style="margin:0 0 8px;color:#0f172a;font-size:15px;">Merhaba ${recipientName},</p>
                <p style="margin:0;color:#475569;font-size:14px;line-height:1.5;">
                  Son 24 saatte ${items.length} yeni bildiriminiz var:
                </p>
              </td>
            </tr>
            ${rows}
            <tr>
              <td style="padding:20px 24px;">
                <a href="${dashboardUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:10px;">Tüm Bildirimleri Gör</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                  Bu e-postayı Kamu Radar bildirim tercihlerinizde "Günlük Özet" seçili olduğu için alıyorsunuz.
                  Ayarlar sayfasından tercihinizi değiştirebilirsiniz.
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
