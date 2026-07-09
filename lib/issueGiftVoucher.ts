import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings, getSocialLinks } from "@/lib/data";
import { generateUniqueVoucherCode } from "@/lib/generateVoucherCode";
import { buildVoucherEmailHtml } from "@/lib/voucherEmail";
import { sendEmail } from "@/lib/email";

type IssueResult =
  | { outcome: "issued"; code: string; amount: number; alreadyIssued: boolean }
  | { outcome: "not_found" | "not_paid" | "error"; error?: unknown };

export type VoucherEmailRecipientInfo = {
  amount: number;
  buyer_name: string;
  buyer_email: string;
  recipient_name: string | null;
  recipient_email: string | null;
};

export async function sendVoucherEmails(pendingOrder: VoucherEmailRecipientInfo, code: string) {
  const [settings, socialLinks] = await Promise.all([getSiteSettings(), getSocialLinks()]);
  const instagramLink = socialLinks.find((s) => s.icon_key === "instagram");

  const emailHtml = buildVoucherEmailHtml({
    amount: pendingOrder.amount,
    buyerName: pendingOrder.buyer_name,
    recipientName: pendingOrder.recipient_name,
    code,
    siteUrl: "hairbytanyam.com",
    phone: settings?.contact_phone,
    instagramHandle: instagramLink?.platform,
  });

  await sendEmail({
    to: pendingOrder.buyer_email,
    subject: "Your Hair by Tanya Gift Voucher",
    html: emailHtml,
  });

  if (
    pendingOrder.recipient_email &&
    pendingOrder.recipient_email !== pendingOrder.buyer_email
  ) {
    await sendEmail({
      to: pendingOrder.recipient_email,
      subject: `${pendingOrder.buyer_name} sent you a Hair by Tanya Gift Voucher!`,
      html: emailHtml,
    });
  }
}

export async function issueGiftVoucherForPaidCheckout(checkoutId: string): Promise<IssueResult> {
  const supabase = createAdminClient();

  const { data: pendingOrder, error: orderError } = await supabase
    .from("voucher_pending_orders")
    .select("*")
    .eq("sumup_checkout_id", checkoutId)
    .single();

  if (orderError || !pendingOrder) {
    console.error("voucher pending order lookup error", orderError);
    return { outcome: "not_found", error: orderError };
  }

  const { data: existingVoucher } = await supabase
    .from("gift_vouchers")
    .select("code, amount")
    .eq("sumup_checkout_id", checkoutId)
    .maybeSingle();

  if (existingVoucher) {
    await supabase
      .from("voucher_pending_orders")
      .update({ completed: true })
      .eq("id", pendingOrder.id);

    return {
      outcome: "issued",
      code: existingVoucher.code,
      amount: Number(existingVoucher.amount),
      alreadyIssued: true,
    };
  }

  const code = await generateUniqueVoucherCode();

  const { error: voucherInsertError } = await supabase.from("gift_vouchers").insert({
    code,
    amount: pendingOrder.amount,
    balance: pendingOrder.amount,
    buyer_name: pendingOrder.buyer_name,
    buyer_email: pendingOrder.buyer_email,
    recipient_name: pendingOrder.recipient_name,
    recipient_email: pendingOrder.recipient_email,
    sumup_checkout_id: checkoutId,
  });

  if (voucherInsertError) {
    console.error("gift_vouchers insert error", voucherInsertError);

    // If the customer return page and the webhook run at the same time, the
    // unique checkout index may make one insert win and the other fail. In that
    // case, return the voucher that was just created by the other request.
    const { data: voucherCreatedConcurrently } = await supabase
      .from("gift_vouchers")
      .select("code, amount")
      .eq("sumup_checkout_id", checkoutId)
      .maybeSingle();

    if (voucherCreatedConcurrently) {
      await supabase
        .from("voucher_pending_orders")
        .update({ completed: true })
        .eq("id", pendingOrder.id);

      return {
        outcome: "issued",
        code: voucherCreatedConcurrently.code,
        amount: Number(voucherCreatedConcurrently.amount),
        alreadyIssued: true,
      };
    }

    return { outcome: "error", error: voucherInsertError };
  }

  await supabase
    .from("voucher_pending_orders")
    .update({ completed: true })
    .eq("id", pendingOrder.id);

  try {
    await sendVoucherEmails(pendingOrder, code);
  } catch (emailError) {
    console.error("voucher email send error", emailError);
    // The voucher is still valid and recorded even if the email fails.
  }

  return {
    outcome: "issued",
    code,
    amount: Number(pendingOrder.amount),
    alreadyIssued: false,
  };
}
