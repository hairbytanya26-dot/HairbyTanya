// Recreates the Hair by Tanya gift voucher design (GIFT Voucher card, logo,
// value circle, To/From/Code lines, footer bar) as a branded HTML email,
// since dynamically editing the original PNG server-side isn't practical.
// Built with an HTML table layout for maximum email client compatibility.

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
  const toLine = recipientName || "&nbsp;";

  return `
<div style="background:#F7E9E4; padding:24px; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" style="max-width:600px; margin:0 auto; background:#F7E9E4; border:2px solid #B97662; border-radius:4px;" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:32px 32px 8px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;">
              <div style="font-size:28px; letter-spacing:4px; color:#2B2B2B; font-weight:bold;">GIFT</div>
              <div style="font-size:32px; color:#B97662; font-style:italic; font-family: 'Brush Script MT', cursive; margin-top:-6px;">Voucher</div>
              <div style="font-size:12px; letter-spacing:2px; color:#B97662; margin-top:8px;">A SPECIAL GIFT FOR YOU</div>
            </td>
            <td style="vertical-align:top; text-align:right;">
              <img
                src="https://hairbytanyam.com/images/logo.png"
                alt="Hair by Tanya"
                width="110"
                style="display:inline-block; width:110px; height:auto;"
              />
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;">
        <table role="presentation" width="100%" style="border:1px solid #B97662; border-radius:8px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:24px; width:40%; text-align:center; border-right:1px solid #B97662;">
              <div style="font-size:12px; letter-spacing:2px; color:#B97662; margin-bottom:12px;">VALUE</div>
              <div style="display:inline-block; width:110px; height:110px; line-height:110px; border:2px dotted #B97662; border-radius:50%; font-size:26px; color:#2B2B2B; font-weight:bold;">
                &euro;${amount.toFixed(2)}
              </div>
            </td>
            <td style="padding:24px; vertical-align:top;">
              <div style="font-size:12px; letter-spacing:1px; color:#B97662;">TO:</div>
              <div style="font-size:16px; color:#2B2B2B; border-bottom:1px solid #B97662; padding-bottom:6px; margin-bottom:14px;">${toLine}</div>
              <div style="font-size:12px; letter-spacing:1px; color:#B97662;">FROM:</div>
              <div style="font-size:16px; color:#2B2B2B; border-bottom:1px solid #B97662; padding-bottom:6px; margin-bottom:14px;">${buyerName}</div>
              <div style="font-size:12px; letter-spacing:1px; color:#B97662;">VOUCHER CODE:</div>
              <div style="font-size:18px; color:#2B2B2B; font-weight:bold; letter-spacing:1px;">${code}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 32px; text-align:center; font-size:13px; color:#2B2B2B;">
        This voucher can be redeemed against any hair service.
      </td>
    </tr>
    <tr>
      <td style="padding:0;">
        <table role="presentation" width="100%" style="background:#B97662; margin-top:16px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:14px 32px; text-align:center; color:#FCF4F1; font-size:13px;">
              &#127760;&nbsp;${siteUrl}${phone ? `&nbsp;&nbsp;&bull;&nbsp;&nbsp;&#128241;&nbsp;${phone}` : ""}${instagramHandle ? `&nbsp;&nbsp;&bull;&nbsp;&nbsp;<img src="https://hairbytanyam.com/images/icon-instagram.png" alt="Instagram" width="14" style="display:inline-block; vertical-align:middle; width:14px; height:14px;" />&nbsp;${instagramHandle}` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 32px 28px 32px; text-align:center; font-size:12px; letter-spacing:1px; color:#B97662;">
        THANK YOU FOR SUPPORTING MY SMALL BUSINESS &hearts;
      </td>
    </tr>
  </table>
</div>`;
}
