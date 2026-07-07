import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSumUpCheckout } from "@/lib/sumup";

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
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Please enter a valid voucher amount." }, { status: 400 });
    }
    if (amountNum > 1000) {
      return NextResponse.json({ error: "For amounts over €1000, please contact us directly." }, { status: 400 });
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
      })
      .select()
      .single();

    if (insertError || !pendingOrder) {
      console.error("voucher_pending_orders insert error", insertError);
      return NextResponse.json({ error: "Could not start your order. Please try again." }, { status: 500 });
    }

    const origin = new URL(request.url).origin;

    let checkoutResult;
    try {
      checkoutResult = await createSumUpCheckout({
        amount: amountNum,
        reference: pendingOrder.id,
        redirectUrl: `${origin}/gift-vouchers/complete?order=${pendingOrder.id}`,
        webhookUrl: `${origin}/api/gift-vouchers/sumup-webhook`,
        description: `Hair by Tanya Gift Voucher - €${amountNum.toFixed(2)}`,
      });
    } catch (sumupError) {
      console.error("SumUp checkout creation error", sumupError);
      await supabase.from("voucher_pending_orders").delete().eq("id", pendingOrder.id);
      return NextResponse.json(
        { error: "Could not start payment. Please try again shortly, or contact us directly." },
        { status: 500 }
      );
    }

    await supabase
      .from("voucher_pending_orders")
      .update({ sumup_checkout_id: checkoutResult.checkoutId })
      .eq("id", pendingOrder.id);

    return NextResponse.json({ checkoutUrl: checkoutResult.hostedCheckoutUrl });
  } catch (err) {
    console.error("create-checkout route error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
