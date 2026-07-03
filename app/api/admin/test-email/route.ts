import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  // Admin-only — confirm the caller is signed in before doing anything.
  const authClient = createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { to } = await request.json();
  const recipient = to || process.env.GMAIL_USER;

  if (!recipient) {
    return NextResponse.json({ error: "No recipient email provided or configured." }, { status: 400 });
  }

  const envCheck = {
    GMAIL_USER: process.env.GMAIL_USER ? `set (${process.env.GMAIL_USER})` : "MISSING",
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? "set (hidden)" : "MISSING",
    GMAIL_FROM_NAME: process.env.GMAIL_FROM_NAME || "not set (will default to 'Hair by Tanya')",
  };

  try {
    await sendEmail({
      to: recipient,
      subject: "Test email from your site",
      html: `<p>This is a test email sent at ${new Date().toISOString()} to confirm your Gmail SMTP settings are working.</p>`,
    });
    return NextResponse.json({ success: true, sentTo: recipient, envCheck });
  } catch (err) {
    // Surface the real error straight to the browser instead of only logging it server-side.
    const details =
      err instanceof Error
        ? { message: err.message, name: err.name, stack: err.stack, raw: JSON.stringify(err) }
        : { message: String(err) };
    return NextResponse.json({ error: "Send failed", details, envCheck }, { status: 500 });
  }
}
