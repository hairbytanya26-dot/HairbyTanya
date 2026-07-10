import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniqueVoucherCode } from "@/lib/generateVoucherCode";
import { sendVoucherEmails } from "@/lib/issueGiftVoucher";

export async function POST(request: Request) {
  const authClient = createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { orderId } = await request.json();
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: pendingOrder, error: fetchError } = await supabase
    .from("voucher_pending_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !pendingOrder) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (pendingOrder.completed) {
    return NextResponse.json({ error: "This request has already been approved." }, { status: 409 });
  }

  const code = await generateUniqueVoucherCode();

  const { data: voucher, error: voucherError } = await supabase
    .from("gift_vouchers")
    .insert({
      code,
      amount: pendingOrder.amount,
      balance: pendingOrder.amount,
      buyer_name: pendingOrder.buyer_name,
      buyer_email: pendingOrder.buyer_email,
      recipient_name: pendingOrder.recipient_name,
      recipient_email: pendingOrder.recipient_email,
      sumup_checkout_id: null,
      voucher_type: "purchased",
    })
    .select()
    .single();

  if (voucherError || !voucher) {
    console.error("voucher creation error on approval", voucherError);
    return NextResponse.json({ error: "Could not create the voucher. Please try again." }, { status: 500 });
  }

  await supabase.from("voucher_pending_orders").update({ completed: true }).eq("id", orderId);

  let emailSent = false;
  try {
    await sendVoucherEmails(
      {
        amount: pendingOrder.amount,
        buyer_name: pendingOrder.buyer_name,
        buyer_email: pendingOrder.buyer_email,
        recipient_name: pendingOrder.recipient_name,
        recipient_email: pendingOrder.recipient_email,
      },
      code
    );
    emailSent = true;
  } catch (emailError) {
    console.error("approval email send error", emailError);
  }

  return NextResponse.json({ success: true, voucher, emailSent });
}
