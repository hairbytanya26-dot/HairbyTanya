import nodemailer from "nodemailer";

// Uses Gmail SMTP with an "app password" (see README for setup steps).
// To later migrate to a transactional provider like Resend, this is the
// only file that needs to change — everything else calls sendEmail().
function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export function fillTemplate(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    template
  );
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = getTransporter();
  const fromName = process.env.GMAIL_FROM_NAME || "Hair by Tanya";

  await transporter.sendMail({
    from: `"${fromName}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
