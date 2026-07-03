import type { Metadata } from "next";
import { Playfair_Display, Lato, Alex_Brush } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/data";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700", "900"],
});

const script = Alex_Brush({
  subsets: ["latin"],
  variable: "--font-script",
  weight: ["400"],
});

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hairbytanyam.com"),
  title: {
    default: "Hair by Tanya | Hairdresser — Cuts, Colour & Styling",
    template: "%s | Hair by Tanya",
  },
  description:
    "Hair by Tanya — cuts, colour, and styling with a personal touch. Book your appointment online.",
  openGraph: {
    title: "Hair by Tanya",
    description: "Cuts, colour, and styling with a personal touch. Book your appointment online.",
    url: "https://hairbytanyam.com",
    siteName: "Hair by Tanya",
    locale: "en_IE",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  // Tells Google explicitly "this is a local hair salon business called
  // Hair by Tanya" — helps branded searches (e.g. "hair by tanya") surface
  // the right result and can feed into a Knowledge Panel over time.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: settings?.business_name || "Hair by Tanya",
    url: "https://hairbytanyam.com",
    image: "https://hairbytanyam.com/images/logo.png",
    telephone: settings?.contact_phone || undefined,
    email: settings?.contact_email || undefined,
    address: settings?.address
      ? {
          "@type": "PostalAddress",
          streetAddress: settings.address,
          addressCountry: "IE",
        }
      : undefined,
    priceRange: "€€",
  };

  return (
    <html lang="en">
      <body className={`${playfair.variable} ${script.variable} ${lato.variable} font-body antialiased bg-blush text-plum`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
