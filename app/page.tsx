import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import MailingListPopup from "@/components/MailingListPopup";
import { getSiteSettings, getSocialLinks, getGalleryImages } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const [settings, socialLinks, galleryImages] = await Promise.all([
    getSiteSettings(),
    getSocialLinks(),
    getGalleryImages(),
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

      {/* Gallery */}
      <section className="bg-blush px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-3xl text-plum md:text-4xl">Gallery</h2>
          <p className="mx-auto mt-3 max-w-xl font-body text-plum/80">
            A look at some recent work.
          </p>

          {galleryImages.length === 0 ? (
            <p className="mt-12 font-body text-plum/60">
              Photos coming soon — add some in the admin panel.
            </p>
          ) : (
            <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {galleryImages.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-2xl bg-rose/30"
                >
                  <Image
                    src={image.image_url}
                    alt={image.caption || "Hair by Tanya gallery photo"}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer socialLinks={socialLinks} settings={settings} />
    </>
  );
}
