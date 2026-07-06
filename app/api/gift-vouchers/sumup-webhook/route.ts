import { NextResponse } from "next/server";
import { getSumUpCheckoutStatus } from "@/lib/sumup";
import { issueGiftVoucherForPaidCheckout } from "@/lib/issueGiftVoucher";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);

    if (payload?.event_type !== "CHECKOUT_STATUS_CHANGED" || typeof payload?.id !== "string") {
      // SumUp may add new event types later. Unknown events should be ignored.
      return new NextResponse(null, { status: 204 });
    }

    const { isPaid } = await getSumUpCheckoutStatus(payload.id);

    if (isPaid) {
      await issueGiftVoucherForPaidCheckout(payload.id);
    }

    // SumUp expects any successful webhook delivery to return a 2xx quickly.
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("SumUp voucher webhook error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
