import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { getSiteSettings, getSocialLinks } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

// Your Revolut personal payment link — update here if it ever changes.
const REVOLUT_PAYMENT_LINK = "http://revolut.me/tanya6emg";

export const revalidate = 0;

export default async function VoucherRequestSentPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const [settings, socialLinks] = await Promise.all([getSiteSettings(), getSocialLinks()]);

  const orderId = searchParams.order;
  let amount: number | null = null;
  let found = false;

  if (orderId) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("voucher_pending_orders")
      .select("amount")
      .eq("id", orderId)
      .single();
    if (data) {
      found = true;
      amount = data.amount;
    }
  }

  return (
    <>
      <NavBar businessName={settings?.business_name ?? "Hair by Tanya"} />

      <section className="bg-blush px-6 py-16 md:py-24">
        <div className="mx-auto max-w-xl text-center">
          {found ? (
            <>
              <h1 className="font-display text-3xl text-plum md:text-4xl">One last step</h1>
              <p className="mt-4 font-body text-plum/80">
                To complete your €{amount?.toFixed(2)} gift voucher, please pay using the Revolut link
                below. Once payment is received, your voucher will be emailed to you.
              </p>
              <a
                href={REVOLUT_PAYMENT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-block rounded-full bg-plum px-8 py-3 font-display text-blush transition-colors hover:bg-glow"
              >
                Pay €{amount?.toFixed(2)} on Revolut
              </a>
              <p className="mt-6 font-body text-sm text-plum/60">
                Vouchers are usually confirmed and emailed within a day. If you don&apos;t hear back
                within 48 hours, please get in touch directly.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl text-plum md:text-4xl">Something went wrong</h1>
              <p className="mt-4 font-body text-plum/80">
                We couldn&apos;t find that request. Please try again from the Gift Vouchers page.
              </p>
            </>
          )}
        </div>
      </section>

      <Footer socialLinks={socialLinks} settings={settings} />
    </>
  );
}
