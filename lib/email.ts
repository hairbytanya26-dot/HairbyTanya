import { Resend } from "resend";

// Uses Resend for transactional email (see README for setup steps).
// This is the only file that talks to the email provider — everything
// else in the app calls sendEmail().
function getClient() {
  return new Resend(process.env.RESEND_API_KEY);
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
  const resend = getClient();
  const fromName = process.env.EMAIL_FROM_NAME || "Hair by Tanya";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from: `${fromName} <${fromAddress}>`,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(typeof error === "string" ? error : JSON.stringify(error));
  }
}
