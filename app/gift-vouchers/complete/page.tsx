import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { getSiteSettings, getSocialLinks } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSumUpCheckoutStatus } from "@/lib/sumup";
import { issueGiftVoucherForPaidCheckout } from "@/lib/issueGiftVoucher";
import Link from "next/link";

export const revalidate = 0;

export default async function GiftVoucherCompletePage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const [settings, socialLinks] = await Promise.all([getSiteSettings(), getSocialLinks()]);
  const supabase = createAdminClient();

  const orderId = searchParams.order;
  let outcome: "invalid" | "not_paid" | "issued" = "invalid";
  let voucherCode: string | null = null;
  let voucherAmount: number | null = null;

  if (orderId) {
    const { data: pendingOrder } = await supabase
      .from("voucher_pending_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (pendingOrder) {
      if (pendingOrder.sumup_checkout_id) {
        try {
          const { isPaid } = await getSumUpCheckoutStatus(pendingOrder.sumup_checkout_id);

          if (isPaid) {
            const issueResult = await issueGiftVoucherForPaidCheckout(pendingOrder.sumup_checkout_id);

            if (issueResult.outcome === "issued") {
              outcome = "issued";
              voucherCode = issueResult.code;
              voucherAmount = issueResult.amount;
            }
          } else {
            outcome = "not_paid";
          }
        } catch (statusError) {
          console.error("SumUp status check error", statusError);
        }
      }
    }
  }

  return (
    <>
      <NavBar businessName={settings?.business_name ?? "Hair by Tanya"} />

      <section className="bg-blush px-6 py-16 md:py-24">
        <div className="mx-auto max-w-xl text-center">
          {outcome === "issued" && (
            <>
              <h1 className="font-display text-3xl text-plum md:text-4xl">Voucher purchased! ✨</h1>
              <p className="mt-4 font-body text-plum/80">
                Thank you! A copy of your €{voucherAmount?.toFixed(2)} gift voucher has been emailed to you.
              </p>
              <p className="mt-4 rounded-2xl bg-white/70 p-4 font-display text-xl text-plum">
                Voucher code: {voucherCode}
              </p>
            </>
          )}

          {outcome === "not_paid" && (
            <>
              <h1 className="font-display text-3xl text-plum md:text-4xl">Payment not completed</h1>
              <p className="mt-4 font-body text-plum/80">
                It looks like the payment didn&apos;t go through. No voucher has been issued, and you
                haven&apos;t been charged.
              </p>
              <Link
                href="/gift-vouchers"
                className="mt-6 inline-block rounded-full bg-plum px-8 py-3 font-display text-blush transition-colors hover:bg-glow"
              >
                Try again
              </Link>
            </>
          )}

          {outcome === "invalid" && (
            <>
              <h1 className="font-display text-3xl text-plum md:text-4xl">Something went wrong</h1>
              <p className="mt-4 font-body text-plum/80">
                We couldn&apos;t find that order. If you were charged and didn&apos;t receive a voucher,
                please contact us directly and we&apos;ll sort it out.
              </p>
            </>
          )}
        </div>
      </section>

      <Footer socialLinks={socialLinks} settings={settings} />
    </>
  );
}
