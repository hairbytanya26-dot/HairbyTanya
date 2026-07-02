import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import MailingListPopup from "@/components/MailingListPopup";
import { getSiteSettings, getSocialLinks, getPriceList } from "@/lib/data";
import Link from "next/link";

export default async function Home() {
  const [settings, socialLinks, { categories }] = await Promise.all([
    getSiteSettings(),
    getSocialLinks(),
    getPriceList(),
  ]);

  return (
    <>
      <MailingListPopup />
      <NavBar businessName={settings?.business_name ?? "Hair by Tanya"} />

      {/* Hero */}
      <section className="bg-blush px-6 py-20 text-center md:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="font-body text-sm uppercase tracking-[0.3em] text-glow">
            {settings?.hero_kicker}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-mauve md:text-6xl">
            {settings?.hero_title ?? "Welcome to Hair by Tanya"}
          </h1>
          <p className="mt-6 font-body text-lg text-plum md:text-xl">
            {settings?.hero_subtitle}
          </p>
          <p className="mt-3 font-body text-base italic text-maroon">
            {settings?.hero_tagline}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/bookings"
              className="rounded-full bg-plum px-8 py-3 font-display text-blush transition-colors hover:bg-glow"
            >
              Book an appointment
            </Link>
            <Link
              href="/pricelist"
              className="rounded-full border-2 border-plum px-8 py-3 font-display text-plum transition-colors hover:bg-plum hover:text-blush"
            >
              View price list
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-plum px-6 py-20 text-blush md:py-28">
        <div className="mx-auto max-w-3xl">
          {settings?.about_eyebrow && (
            <p className="font-body text-sm uppercase tracking-[0.3em] text-rose">
              {settings.about_eyebrow}
            </p>
          )}
          <h2 className="mt-3 font-display text-3xl md:text-4xl">
            {settings?.about_title ?? "About Hair by Tanya"}
          </h2>
          <p className="mt-6 font-body text-base leading-relaxed text-blush/90 md:text-lg">
            {settings?.about_body}
          </p>
        </div>
      </section>

      {/* Services teaser */}
      <section className="bg-blush px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-3xl text-plum md:text-4xl">Our Services</h2>
          <p className="mx-auto mt-3 max-w-xl font-body text-plum/80">
            A snapshot of what we offer — see the full price list for every treatment and cost.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {(categories.length > 0
              ? categories
              : [{ id: "placeholder", name: "Add your treatment categories in the admin panel" }]
            )
              .slice(0, 6)
              .map((category) => (
                <div
                  key={category.id}
                  className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-rose/40 p-6 text-center transition-transform hover:-translate-y-1 hover:bg-rose/60"
                >
                  <span className="font-display text-lg text-plum md:text-xl">
                    {category.name}
                  </span>
                </div>
              ))}
          </div>

          <Link
            href="/pricelist"
            className="mt-10 inline-block rounded-full bg-maroon px-8 py-3 font-display text-blush transition-colors hover:bg-glow"
          >
            See full price list
          </Link>
        </div>
      </section>

      <Footer socialLinks={socialLinks} settings={settings} />
    </>
  );
}
