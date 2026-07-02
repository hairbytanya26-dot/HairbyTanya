import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ReviewForm from "@/components/ReviewForm";
import { getSiteSettings, getSocialLinks, getReviews } from "@/lib/data";

export const revalidate = 0;

function Stars({ rating }: { rating: number }) {
  return (
    <div aria-label={`${rating} out of 5 stars`} className="text-glow">
      {"★".repeat(rating)}
      <span className="text-rose/60">{"★".repeat(5 - rating)}</span>
    </div>
  );
}

export default async function ReviewsPage() {
  const [settings, socialLinks, reviews] = await Promise.all([
    getSiteSettings(),
    getSocialLinks(),
    getReviews(),
  ]);

  return (
    <>
      <NavBar businessName={settings?.business_name ?? "Hair by Tanya"} />

      <section className="bg-blush px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl text-plum md:text-5xl">Reviews</h1>
          <p className="mt-4 font-body text-plum/80">What our clients say.</p>
        </div>

        <div className="mx-auto mt-14 max-w-2xl">
          <ReviewForm />
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2">
          {reviews.length === 0 && (
            <p className="col-span-full text-center font-body text-plum/70">
              Reviews are coming soon.
            </p>
          )}
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl bg-white/70 p-6 shadow-sm">
              <Stars rating={review.rating} />
              <p className="mt-4 font-body italic text-plum/90">&ldquo;{review.body}&rdquo;</p>
              <p className="mt-4 font-display text-sm text-mauve">— {review.author_name}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer socialLinks={socialLinks} settings={settings} />
    </>
  );
}
