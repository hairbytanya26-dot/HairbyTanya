import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { getSiteSettings, getSocialLinks, getPriceList } from "@/lib/data";

export const revalidate = 60; // pick up admin price changes within a minute

export default async function PriceListPage() {
  const [settings, socialLinks, { categories, itemsByCategory }] = await Promise.all([
    getSiteSettings(),
    getSocialLinks(),
    getPriceList(),
  ]);

  return (
    <>
      <NavBar businessName={settings?.business_name ?? "Hair by Tanya"} />

      <section className="bg-blush px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl text-plum md:text-5xl">Price List</h1>
          <p className="mt-4 font-body text-plum/80">
            Every treatment, priced and ready to book.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl space-y-14">
          {categories.length === 0 && (
            <p className="text-center font-body text-plum/70">
              The price list is being updated — please check back shortly.
            </p>
          )}

          {categories.map((category) => {
            const items = itemsByCategory[category.id] ?? [];
            if (items.length === 0) return null;

            return (
              <div key={category.id}>
                <h2 className="border-b-2 border-rose pb-2 font-display text-2xl text-mauve">
                  {category.name}
                </h2>
                <ul className="mt-4 divide-y divide-rose/50">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                      <div>
                        <p className="font-body text-lg font-semibold text-plum">{item.name}</p>
                        {item.description && (
                          <p className="mt-1 font-body text-sm text-plum/70">{item.description}</p>
                        )}
                        {item.duration_minutes && (
                          <p className="mt-1 font-body text-xs uppercase tracking-wide text-mauve">
                            {item.duration_minutes} mins
                          </p>
                        )}
                      </div>
                      <p className="whitespace-nowrap font-display text-lg text-maroon">
                        €{item.price.toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <Footer socialLinks={socialLinks} settings={settings} />
    </>
  );
}
