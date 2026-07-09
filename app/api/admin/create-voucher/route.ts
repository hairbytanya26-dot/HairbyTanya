import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniqueVoucherCode } from "@/lib/generateVoucherCode";
import { sendVoucherEmails } from "@/lib/issueGiftVoucher";

export async function POST(request: Request) {
  // Admin-only — confirm the caller is signed in before creating anything.
  const authClient = createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { amount, buyerName, buyerEmail, recipientName, recipientEmail } = await request.json();

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: "Please enter a valid amount." }, { status: 400 });
  }
  if (!buyerName || typeof buyerName !== "string" || !buyerName.trim()) {
    return NextResponse.json({ error: "Please enter a name for this voucher." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const code = await generateUniqueVoucherCode();
  const trimmedEmail = buyerEmail?.trim() || "";

  const { data: voucher, error } = await supabase
    .from("gift_vouchers")
    .insert({
      code,
      amount: amountNum,
      balance: amountNum,
      buyer_name: buyerName.trim(),
      buyer_email: trimmedEmail || "—",
      recipient_name: recipientName?.trim() || null,
      recipient_email: recipientEmail?.trim() || null,
      sumup_checkout_id: null,
    })
    .select()
    .single();

  if (error || !voucher) {
    console.error("manual voucher creation error", error);
    return NextResponse.json({ error: "Could not create the voucher. Please try again." }, { status: 500 });
  }

  // Send the same automated voucher email a customer would get, as long as
  // a real email address was actually entered (cash/walk-in sales with no
  // email on file simply skip this step — there's nowhere to send it).
  let emailSent = false;
  if (trimmedEmail) {
    try {
      await sendVoucherEmails(
        {
          amount: amountNum,
          buyer_name: buyerName.trim(),
          buyer_email: trimmedEmail,
          recipient_name: recipientName?.trim() || null,
          recipient_email: recipientEmail?.trim() || null,
        },
        code
      );
      emailSent = true;
    } catch (emailError) {
      console.error("manual voucher email send error", emailError);
      // The voucher is still created and valid even if the email fails —
      // worth checking the recipient's inbox/spam or trying again.
    }
  }

  return NextResponse.json({ success: true, voucher, emailSent });
}
