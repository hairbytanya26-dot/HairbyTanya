"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/settings", label: "Site Text" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/pricelist", label: "Price List" },
  { href: "/admin/socials", label: "Social Links" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/availability", label: "Availability & Bookings" },
  { href: "/admin/mailing-list", label: "Mailing List" },
  { href: "/admin/emails", label: "Email Templates" },
  { href: "/admin/google-setup", label: "Google Calendar" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return null;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-rose bg-white/60">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <span className="font-display text-lg text-plum">Hair by Tanya Admin</span>
        <button
          onClick={handleSignOut}
          className="rounded-full border border-plum px-4 py-1.5 text-sm text-plum transition-colors hover:bg-plum hover:text-blush"
        >
          Sign out
        </button>
      </div>
      <nav className="mx-auto flex max-w-5xl flex-wrap gap-2 px-6 pb-4 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              pathname === link.href
                ? "bg-plum text-blush"
                : "bg-rose/40 text-plum hover:bg-rose/70"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
