import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import BookingWidget from "@/components/BookingWidget";
import { getSiteSettings, getSocialLinks } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { ensureSlotsGenerated } from "@/lib/autoGenerateSlots";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Book your hair appointment online with Hair by Tanya — pick a time that suits you.",
};

export const revalidate = 0; // always fetch fresh slot availability

export default async function BookingsPage() {
  const supabase = createClient();

  // Keeps the rolling 6-week availability window topped up automatically —
  // safe to call on every visit since it only fills genuine gaps.
  await ensureSlotsGenerated();

  const [settings, socialLinks, slotsResult, servicesResult, categoriesResult] = await Promise.all([
    getSiteSettings(),
    getSocialLinks(),
    supabase
      .from("availability_slots")
      .select("*")
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(1000),
    supabase.from("price_items").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("price_categories").select("*").eq("is_active", true).order("sort_order"),
  ]);

  return (
    <>
      <NavBar businessName={settings?.business_name ?? "Hair by Tanya"} />

      <section className="bg-blush px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl text-plum md:text-5xl">Bookings</h1>
          <p className="mt-4 font-body text-plum/80">Pick a slot that suits you.</p>
        </div>

        <div className="mt-14">
          <BookingWidget
            slots={slotsResult.data ?? []}
            services={servicesResult.data ?? []}
            categories={categoriesResult.data ?? []}
            bookingNotice={settings?.booking_notice ?? undefined}
          />
        </div>
      </section>

      <Footer socialLinks={socialLinks} settings={settings} />
    </>
  );
}
