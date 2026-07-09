// Luxury Hair by Tanya gift voucher email template.
// Uses an email-safe HTML table layout with inline styles so it renders reliably
// in Gmail, Apple Mail, Outlook and mobile email clients.

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normaliseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function buildVoucherEmailHtml({
  amount,
  buyerName,
  recipientName,
  code,
  siteUrl,
  phone,
  instagramHandle,
}: {
  amount: number;
  buyerName: string;
  recipientName?: string | null;
  code: string;
  siteUrl: string;
  phone?: string | null;
  instagramHandle?: string | null;
}): string {
  const brandUrl = normaliseUrl(siteUrl || "https://hairbytanyam.com");
  const displayUrl = brandUrl.replace(/^https?:\/\//i, "");
  const logoUrl = `${brandUrl}/images/logo.png`;
  const instagramIconUrl = `${brandUrl}/images/icon-instagram.png`;

  const safeAmount = Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
  const safeBuyerName = escapeHtml(buyerName);
  const safeRecipientName = recipientName ? escapeHtml(recipientName) : "&nbsp;";
  const safeCode = escapeHtml(code);
  const safePhone = phone ? escapeHtml(phone) : "";
  const safeInstagram = instagramHandle ? escapeHtml(instagramHandle) : "";

  return `
<div style="margin:0; padding:0; background:#f6ebe7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; background:#f6ebe7; margin:0; padding:28px 12px; border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; max-width:760px; background:#fff8f5; border:1px solid #b97968; border-radius:18px; border-collapse:separate; overflow:hidden; box-shadow:0 14px 36px rgba(88,55,47,0.14);">
          <tr>
            <td style="padding:34px 34px 22px 34px; text-align:center; background:linear-gradient(180deg,#fffaf8 0%,#f8ece8 100%);">
              <img src="${logoUrl}" width="250" alt="Hair By Tanya" style="display:block; width:250px; max-width:76%; height:auto; margin:0 auto 18px auto; border:0; outline:none; text-decoration:none;" />
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto; border-collapse:collapse;">
                <tr>
                  <td style="width:64px; border-top:1px solid #b97968; line-height:1px; font-size:1px;">&nbsp;</td>
                  <td style="padding:0 16px; font-family:Georgia,'Times New Roman',serif; font-size:34px; letter-spacing:8px; color:#2f3030; text-transform:uppercase;">GIFT</td>
                  <td style="width:64px; border-top:1px solid #b97968; line-height:1px; font-size:1px;">&nbsp;</td>
                </tr>
              </table>
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:18px; letter-spacing:7px; color:#b97968; text-transform:uppercase; margin-top:4px;">Voucher</div>
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:13px; letter-spacing:3px; color:#333333; text-transform:uppercase; margin-top:20px; line-height:1.6;">A special gift for you</div>
              <div style="font-family:Georgia,'Times New Roman',serif; color:#b97968; font-size:20px; margin-top:8px;">&hearts;</div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 26px 22px 26px; background:#fff8f5;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; border:1px solid #b97968; border-radius:14px; border-collapse:separate; overflow:hidden; background:#fffaf8;">
                <tr>
                  <td width="38%" valign="middle" style="padding:34px 22px; text-align:center; border-right:1px solid #b97968; background:#fff7f4;">
                    <div style="font-family:Arial,Helvetica,sans-serif; font-size:13px; letter-spacing:4px; color:#b97968; text-transform:uppercase; margin-bottom:16px;">Value</div>
                    <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="width:160px; height:160px; border:2px solid #b97968; border-radius:160px; border-collapse:separate;">
                      <tr>
                        <td align="center" valign="middle" style="font-family:Georgia,'Times New Roman',serif; font-size:42px; color:#2f3030; line-height:1; font-weight:normal;">
                          &euro;${safeAmount}
                        </td>
                      </tr>
                    </table>
                    <div style="font-family:Georgia,'Times New Roman',serif; font-size:28px; color:#e8d6d0; margin-top:-22px; text-align:left; line-height:1;">&#10087;</div>
                  </td>
                  <td valign="top" style="padding:34px 34px 28px 34px;">
                    <div style="font-family:Arial,Helvetica,sans-serif; font-size:13px; letter-spacing:3px; color:#b97968; text-transform:uppercase; margin-bottom:8px;">To:</div>
                    <div style="font-family:Arial,Helvetica,sans-serif; font-size:18px; color:#2f3030; border-bottom:1px solid #b97968; padding:0 0 10px 0; min-height:22px; margin-bottom:22px;">${safeRecipientName}</div>

                    <div style="font-family:Arial,Helvetica,sans-serif; font-size:13px; letter-spacing:3px; color:#b97968; text-transform:uppercase; margin-bottom:8px;">From:</div>
                    <div style="font-family:Arial,Helvetica,sans-serif; font-size:18px; color:#2f3030; border-bottom:1px solid #b97968; padding:0 0 10px 0; min-height:22px; margin-bottom:22px;">${safeBuyerName}</div>

                    <div style="font-family:Arial,Helvetica,sans-serif; font-size:13px; letter-spacing:3px; color:#b97968; text-transform:uppercase; margin-bottom:8px;">Voucher code:</div>
                    <div style="font-family:Arial,Helvetica,sans-serif; font-size:24px; color:#2f3030; font-weight:700; letter-spacing:2px; line-height:1.25;">${safeCode}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 34px 28px 34px; text-align:center; background:#fff8f5;">
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:16px; color:#333333; line-height:1.6;">This voucher can be redeemed against any hair service.</div>
            </td>
          </tr>

          <tr>
            <td style="background:#b97968; padding:18px 26px; text-align:center;">
              <span style="font-family:Arial,Helvetica,sans-serif; font-size:15px; color:#fff8f5; line-height:2; white-space:nowrap;">&#127760;&nbsp; ${escapeHtml(displayUrl)}</span>
              ${safePhone ? `<span style="font-family:Arial,Helvetica,sans-serif; font-size:15px; color:#fff8f5; line-height:2; white-space:nowrap;">&nbsp;&nbsp;|&nbsp;&nbsp;&#128241;&nbsp; ${safePhone}</span>` : ""}
              ${safeInstagram ? `<span style="font-family:Arial,Helvetica,sans-serif; font-size:15px; color:#fff8f5; line-height:2; white-space:nowrap;">&nbsp;&nbsp;|&nbsp;&nbsp;<img src="${instagramIconUrl}" alt="Instagram" width="15" height="15" style="display:inline-block; width:15px; height:15px; vertical-align:-2px; border:0;" />&nbsp; ${safeInstagram}</span>` : ""}
            </td>
          </tr>

          <tr>
            <td style="padding:20px 26px 28px 26px; text-align:center; background:#fff8f5;">
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:13px; letter-spacing:3px; color:#b97968; text-transform:uppercase; line-height:1.7;">Thank you for supporting my small business &hearts;</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;
}
