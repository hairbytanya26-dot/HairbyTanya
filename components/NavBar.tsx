import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/pricelist", label: "Price List" },
  { href: "/reviews", label: "Reviews" },
  { href: "/bookings", label: "Bookings" },
];

export default function NavBar({ businessName }: { businessName: string }) {
  return (
    <header className="bg-blush">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-8 md:py-10">
        <Link href="/" className="flex items-center justify-center">
          <Image
            src="/images/logo.png"
            alt={`${businessName} logo`}
            width={480}
            height={480}
            className="h-56 w-56 sm:h-72 sm:w-72 md:h-96 md:w-96"
            priority
          />
        </Link>

        <nav className="mt-4 md:mt-6">
          <ul className="flex items-center gap-6 font-display text-sm tracking-wide text-plum md:gap-10 md:text-base">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-3 py-2 transition-colors hover:bg-rose/40 hover:text-maroon"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
