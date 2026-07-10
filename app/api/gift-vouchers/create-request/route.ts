import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { amount, buyerName, buyerEmail, recipientName, recipientEmail } = await request.json();

    if (!buyerName || typeof buyerName !== "string" || !buyerName.trim()) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!buyerEmail || !emailPattern.test(buyerEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum < 20) {
      return NextResponse.json({ error: "The minimum voucher amount is €20." }, { status: 400 });
    }
    if (recipientEmail && !emailPattern.test(recipientEmail)) {
      return NextResponse.json({ error: "Please enter a valid recipient email address." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: settings } = await supabase
      .from("site_settings")
      .select("gift_vouchers_enabled")
      .eq("id", 1)
      .single();

    if (settings && settings.gift_vouchers_enabled === false) {
      return NextResponse.json(
        { error: "Gift vouchers aren't available online right now — please contact us directly." },
        { status: 403 }
      );
    }

    const { data: pendingOrder, error: insertError } = await supabase
      .from("voucher_pending_orders")
      .insert({
        amount: amountNum,
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim().toLowerCase(),
        recipient_name: recipientName?.trim() || null,
        recipient_email: recipientEmail?.trim().toLowerCase() || null,
        payment_method: "revolut",
      })
      .select()
      .single();

    if (insertError || !pendingOrder) {
      console.error("voucher_pending_orders insert error", insertError);
      return NextResponse.json({ error: "Could not start your request. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ requestId: pendingOrder.id });
  } catch (err) {
    console.error("create-request route error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
