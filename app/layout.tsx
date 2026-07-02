import type { Metadata } from "next";
import { Playfair_Display, Lato, Alex_Brush } from "next/font/google";
import "./globals.css";

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
  title: "Hair by Tanya",
  description:
    "Hair by Tanya — cuts, colour, and styling. Book your appointment online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${script.variable} ${lato.variable} font-body antialiased bg-blush text-plum`}>
        {children}
      </body>
    </html>
  );
}
