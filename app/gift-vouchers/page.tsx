import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import GiftVoucherForm from "@/components/GiftVoucherForm";
import { getSiteSettings, getSocialLinks } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gift Vouchers",
  description: "Buy a Hair by Tanya gift voucher — the perfect gift for cuts, colour, and styling.",
};

export const revalidate = 0;

export default async function GiftVouchersPage() {
  const [settings, socialLinks] = await Promise.all([getSiteSettings(), getSocialLinks()]);

  const enabled = settings?.gift_vouchers_enabled ?? true;

  return (
    <>
      <NavBar businessName={settings?.business_name ?? "Hair by Tanya"} />

      <section className="bg-blush px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl text-plum md:text-5xl">Gift Vouchers</h1>
          <p className="mt-4 font-body text-plum/80">
            The perfect gift — redeemable against any treatment.
          </p>
        </div>

        <div className="mt-14">
          {enabled ? (
            <GiftVoucherForm />
          ) : (
            <p className="mx-auto max-w-xl rounded-2xl bg-white/70 p-6 text-center font-body text-plum/70">
              Gift vouchers aren&apos;t available to buy online right now — please contact us directly if
              you&apos;d like one.
            </p>
          )}
        </div>
      </section>

      <Footer socialLinks={socialLinks} settings={settings} />
    </>
  );
}
