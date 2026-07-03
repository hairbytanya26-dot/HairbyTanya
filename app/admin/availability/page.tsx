"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AvailabilitySlot, Booking } from "@/lib/types";
import { format } from "date-fns";

// Booking row with all its selected treatment names embedded via the
// booking_services join table, used only for display here.
type BookingWithServices = Booking & {
  booking_services: { price_items: { name: string } | null }[];
};

// Converts a wall-clock date+time as understood in Europe/Dublin into the
// correct UTC Date, regardless of what timezone the browser/computer is
// actually set to. This makes slot generation immune to a misconfigured
// system clock on whichever computer an admin is using.
function dublinTimeToUTCDate(dateStr: string, hours: number, minutes: number): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  // First guess: treat the wall-clock time as if it were UTC.
  const guess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

  // Ask what that instant reads as in Dublin, to find the current offset
  // (handles Irish Summer Time automatically).
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Dublin",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(guess).reduce((acc: Record<string, string>, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  const dublinReading = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  const offsetMs = dublinReading - guess.getTime();

  // Shift the guess back by however far off Dublin's reading was.
  return new Date(guess.getTime() - offsetMs);
}

export default function AdminAvailabilityPage() {
  const supabase = createClient();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<BookingWithServices[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk slot generator state
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotLengthMins, setSlotLengthMins] = useState(30);
  const [generating, setGenerating] = useState(false);

  async function refresh() {
    const [{ data: slotData }, { data: bookingData }] = await Promise.all([
      supabase
        .from("availability_slots")
        .select("*")
        .gte("start_time", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("start_time"),
      supabase
        .from("bookings")
        .select("*, booking_services(price_items(name))")
        .order("created_at", { ascending: false }),
    ]);
    setSlots(slotData ?? []);
    setBookings((bookingData as unknown as BookingWithServices[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateSlots() {
    if (!date) return;
    setGenerating(true);

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const dayStart = dublinTimeToUTCDate(date, startH, startM);
    const dayEnd = dublinTimeToUTCDate(date, endH, endM);

    const newSlots = [];
    let cursor = new Date(dayStart);
    while (cursor < dayEnd) {
      const slotEnd = new Date(cursor.getTime() + slotLengthMins * 60000);
      if (slotEnd > dayEnd) break;
      newSlots.push({ start_time: cursor.toISOString(), end_time: slotEnd.toISOString() });
      cursor = slotEnd;
    }

    if (newSlots.length > 0) {
      await supabase.from("availability_slots").insert(newSlots);
    }
    setGenerating(false);
    refresh();
  }

  async function deleteSlot(id: string) {
    await supabase.from("availability_slots").delete().eq("id", id);
    refresh();
  }

  async function cancelBooking(bookingId: string) {
    if (!confirm("Cancel this booking? This frees the slot and removes the calendar event.")) return;
    const res = await fetch("/api/admin/cancel-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    if (res.ok) refresh();
    else alert("Could not cancel the booking. Please try again.");
  }

  if (loading) return <p className="text-plum/70">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl text-plum">Availability & Bookings</h1>
      <p className="mt-2 text-plum/70">
        Add open slots below — customers pick from these on the Bookings page, and booked ones grey out
        automatically.
      </p>

      <div className="mt-8 rounded-2xl bg-white/70 p-6">
        <h2 className="font-display text-xl text-mauve">Add slots for a day</h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm text-plum">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-full border border-rose bg-white px-4 py-2 text-plum"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-plum">Start time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-full border border-rose bg-white px-4 py-2 text-plum"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-plum">End time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-full border border-rose bg-white px-4 py-2 text-plum"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-plum">Slot length (mins)</label>
            <input
              type="number"
              value={slotLengthMins}
              onChange={(e) => setSlotLengthMins(parseInt(e.target.value) || 30)}
              className="w-24 rounded-full border border-rose bg-white px-4 py-2 text-plum"
            />
          </div>
          <button
            onClick={generateSlots}
            disabled={!date || generating}
            className="rounded-full bg-plum px-6 py-2 text-blush transition-colors hover:bg-glow disabled:opacity-60"
          >
            {generating ? "Adding…" : "Generate slots"}
          </button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl text-mauve">Upcoming slots</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm ${
                slot.is_booked ? "bg-plum text-blush" : "bg-white/70 text-plum"
              }`}
            >
              {format(new Date(slot.start_time), "d MMM, h:mmaaa")}
              {slot.is_booked && <span className="text-xs">(booked)</span>}
              {!slot.is_booked && (
                <button onClick={() => deleteSlot(slot.id)} className="text-xs opacity-70 hover:opacity-100">
                  ✕
                </button>
              )}
            </div>
          ))}
          {slots.length === 0 && <p className="text-plum/60">No slots yet — add some above.</p>}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl text-mauve">Bookings</h2>
        <div className="mt-4 overflow-hidden rounded-2xl bg-white/70">
          <table className="w-full text-left text-sm">
            <thead className="bg-rose/40 text-plum">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Booked on</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-rose/40">
                  <td className="px-4 py-3">{b.customer_name}</td>
                  <td className="px-4 py-3">
                    {b.customer_email}
                    {b.customer_phone && <div className="text-xs text-plum/60">{b.customer_phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {b.booking_services && b.booking_services.length > 0
                      ? b.booking_services
                          .map((bs) => bs.price_items?.name)
                          .filter(Boolean)
                          .join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{b.notes || "—"}</td>
                  <td className="px-4 py-3">{format(new Date(b.created_at), "d MMM yyyy")}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => cancelBooking(b.id)} className="text-xs text-maroon hover:underline">
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-plum/60">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
