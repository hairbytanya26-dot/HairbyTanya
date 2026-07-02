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
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-4">
          <Image
            src="/images/logo.png"
            alt={`${businessName} logo`}
            width={64}
            height={64}
            className="h-14 w-14 md:h-16 md:w-16"
            priority
          />
          <span className="font-display text-2xl font-semibold tracking-wide text-plum md:text-3xl">
            {businessName}
          </span>
        </Link>

        <ul className="flex items-center gap-5 font-display text-sm tracking-wide text-plum md:gap-8 md:text-base">
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
    </header>
  );
}
