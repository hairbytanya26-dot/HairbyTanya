"use client";

import { useMemo, useState } from "react";
import type { AvailabilitySlot, PriceItem } from "@/lib/types";
import { format, isSameDay } from "date-fns";

export default function BookingWidget({
  slots,
  services,
  bookingNotice,
}: {
  slots: AvailabilitySlot[];
  services: PriceItem[];
  bookingNotice?: string;
}) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [localSlots, setLocalSlots] = useState(slots);

  const days = useMemo(() => {
    const grouped: { date: Date; slots: AvailabilitySlot[] }[] = [];
    localSlots
      .slice()
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .forEach((slot) => {
        const slotDate = new Date(slot.start_time);
        const existing = grouped.find((g) => isSameDay(g.date, slotDate));
        if (existing) existing.slots.push(slot);
        else grouped.push({ date: slotDate, slots: [slot] });
      });
    return grouped;
  }, [localSlots]);

  const selectedSlot = localSlots.find((s) => s.id === selectedSlotId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlotId) return;
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlotId, serviceId, name, email, phone, notes }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Someone else took it — grey it out locally and ask them to pick again
          setLocalSlots((prev) =>
            prev.map((s) => (s.id === selectedSlotId ? { ...s, is_booked: true } : s))
          );
          setSelectedSlotId(null);
        }
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white/70 p-10 text-center">
        <h2 className="font-display text-2xl text-plum">Booking confirmed ✨</h2>
        <p className="mt-3 font-body text-plum/80">
          A confirmation email is on its way to {email}. We can&apos;t wait to see you.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {bookingNotice && (
        <p className="mb-8 rounded-xl bg-rose/40 px-5 py-3 text-center font-body text-sm text-plum">
          {bookingNotice}
        </p>
      )}

      {days.length === 0 && (
        <p className="text-center font-body text-plum/70">
          No slots are currently open — please check back soon.
        </p>
      )}

      <div className="space-y-8">
        {days.map(({ date, slots: daySlots }) => (
          <div key={date.toISOString()}>
            <h3 className="font-display text-lg text-mauve">{format(date, "EEEE d MMMM")}</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              {daySlots.map((slot) => {
                const isSelected = slot.id === selectedSlotId;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={slot.is_booked}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`rounded-full border px-4 py-2 font-body text-sm transition-colors ${
                      slot.is_booked
                        ? "cursor-not-allowed border-transparent bg-plum/10 text-plum/30 line-through"
                        : isSelected
                        ? "border-glow bg-glow text-white"
                        : "border-rose bg-white text-plum hover:border-glow hover:text-glow"
                    }`}
                  >
                    {format(new Date(slot.start_time), "h:mmaaa")}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedSlot && (
        <form onSubmit={handleSubmit} className="mt-12 space-y-4 rounded-2xl bg-white/70 p-6 md:p-8">
          <h3 className="font-display text-xl text-plum">
            Confirm your slot — {format(new Date(selectedSlot.start_time), "EEEE d MMMM, h:mmaaa")}
          </h3>

          {services.length > 0 && (
            <div>
              <label htmlFor="service" className="mb-1 block font-body text-sm text-plum">
                Treatment
              </label>
              <select
                id="service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body text-plum focus:border-glow focus:outline-none"
              >
                <option value="">Select a treatment (optional)</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — €{s.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              required
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
            />
            <input
              type="email"
              required
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
            />
          </div>
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
          />
          <textarea
            placeholder="Anything we should know? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-rose bg-white px-4 py-2 font-body text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
          />

          {status === "error" && (
            <p className="font-body text-sm text-maroon" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-full bg-plum px-6 py-3 font-display text-blush transition-colors hover:bg-glow disabled:opacity-60"
          >
            {status === "loading" ? "Booking…" : "Confirm booking"}
          </button>
        </form>
      )}
    </div>
  );
}
