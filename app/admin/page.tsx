import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = createClient();

  const [subscribers, upcomingBookings, openSlots] = await Promise.all([
    supabase.from("mailing_list_subscribers").select("id", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("availability_slots")
      .select("id", { count: "exact", head: true })
      .eq("is_booked", false)
      .gte("start_time", new Date().toISOString()),
  ]);

  const cards = [
    { label: "Mailing list subscribers", value: subscribers.count ?? 0, href: "/admin/mailing-list" },
    { label: "Bookings this week", value: upcomingBookings.count ?? 0, href: "/admin/availability" },
    { label: "Open upcoming slots", value: openSlots.count ?? 0, href: "/admin/availability" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-plum">Welcome back</h1>
      <p className="mt-2 text-plum/70">Everything about your site lives in these tabs.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl bg-white/70 p-6 transition-transform hover:-translate-y-0.5"
          >
            <p className="font-display text-3xl text-maroon">{card.value}</p>
            <p className="mt-1 text-sm text-plum/70">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
