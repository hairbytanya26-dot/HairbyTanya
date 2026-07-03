"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AvailabilitySlot, Booking } from "@/lib/types";
import { format } from "date-fns";
import { dublinTimeToUTCDate } from "@/lib/dublinTime";

// Booking row with all its selected treatment names embedded via the
// booking_services join table, used only for display here.
type BookingWithServices = Booking & {
  booking_services: { price_items: { name: string } | null }[];
};

export default function AdminAvailabilityPage() {
  const supabase = createClient();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<BookingWithServices[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk slot generator state
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotLengthMins, setSlotLengthMins] = useState(15);
  const [generating, setGenerating] = useState(false);

  const [fetchError, setFetchError] = useState<string | null>(null);

  async function refresh() {
    const [
      { data: slotData, error: slotErr },
      { data: bookingData, error: bookingErr },
    ] = await Promise.all([
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

    if (slotErr) console.error("slots fetch error", slotErr);
    if (bookingErr) console.error("bookings fetch error", bookingErr);
    setFetchError(bookingErr?.message || slotErr?.message || null);

    setSlots(slotData ?? []);
    setBookings((bookingData as unknown as BookingWithServices[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/admin/ensure-slots", { method: "POST" }).finally(() => refresh());
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

      {fetchError && (
        <p className="mt-4 rounded-xl bg-maroon/10 px-4 py-3 text-sm text-maroon" role="alert">
          Couldn&apos;t load bookings/slots properly: {fetchError}
        </p>
      )}

      <div className="mt-8 rounded-2xl bg-white/70 p-6">
        <h2 className="font-display text-xl text-mauve">Add slots for a day</h2>
        <p className="mt-1 text-sm text-plum/70">
          Your regular weekly schedule is now handled automatically from{" "}
          <strong>Working Hours</strong> — you shouldn&apos;t need this for normal weeks. Use this only
          for one-off adjustments, like extra availability on a day you don&apos;t normally work. Use a{" "}
          <strong>15-minute slot length</strong> — your treatments (30/45/60/75/90 mins) are all
          multiples of 15, so this lets the booking system pack appointments back-to-back accurately and
          show the correct next available time when a longer booking is made.
        </p>
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
                <th className="px-4 py-3">Appointment</th>
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
                    {b.start_time ? (
                      <>
                        {format(new Date(b.start_time), "d MMM, h:mmaaa")}
                        {b.end_time && <> – {format(new Date(b.end_time), "h:mmaaa")}</>}
                        {b.total_duration_minutes && (
                          <div className="text-xs text-plum/60">{b.total_duration_minutes} mins</div>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
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
                  <td colSpan={7} className="px-4 py-6 text-center text-plum/60">
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
