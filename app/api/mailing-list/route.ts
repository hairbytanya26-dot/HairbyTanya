import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, fillTemplate } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { name, email, birthDay, birthMonth } = await request.json();

    if (!name || typeof name !== "string" || !email || typeof email !== "string") {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const validDay = Number.isInteger(birthDay) && birthDay >= 1 && birthDay <= 31 ? birthDay : null;
    const validMonth = Number.isInteger(birthMonth) && birthMonth >= 1 && birthMonth <= 12 ? birthMonth : null;

    const supabase = createAdminClient();

    const { error: insertError } = await supabase.from("mailing_list_subscribers").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      birth_day: validDay,
      birth_month: validMonth,
    });

    if (insertError) {
      // Unique violation = already subscribed; treat as a friendly success, not an error.
      if (insertError.code === "23505") {
        return NextResponse.json({ success: true, alreadySubscribed: true });
      }
      console.error("mailing_list insert error", insertError);
      return NextResponse.json({ error: "Could not sign you up right now. Please try again." }, { status: 500 });
    }

    // Fetch the admin-customisable welcome email template
    const { data: template } = await supabase
      .from("email_templates")
      .select("subject, body_html")
      .eq("template_key", "mailing_list_welcome")
      .single();

    if (template) {
      try {
        await sendEmail({
          to: email,
          subject: fillTemplate(template.subject, { name }),
          html: fillTemplate(template.body_html, { name, email }),
        });
        await supabase
          .from("mailing_list_subscribers")
          .update({ welcome_email_sent: true })
          .eq("email", email.trim().toLowerCase());
      } catch (emailError) {
        // Subscriber is saved even if the welcome email fails to send —
        // we don't want an SMTP hiccup to block signup.
        console.error("welcome email send error", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("mailing-list route error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
