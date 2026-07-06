"use client";

import { useEffect, useMemo, useState } from "react";
import type { AvailabilitySlot, PriceItem, PriceCategory } from "@/lib/types";
import { format, isSameDay } from "date-fns";

export default function BookingWidget({
  slots,
  services,
  categories,
  bookingNotice,
}: {
  slots: AvailabilitySlot[];
  services: PriceItem[];
  categories: PriceCategory[];
  bookingNotice?: string;
}) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [voucherApplied, setVoucherApplied] = useState<number | null>(null);
  const localSlots = slots;

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

  // How much uninterrupted free time follows the selected slot (walking
  // forward through consecutive, unbooked, gap-free slots). Used to grey
  // out any treatment that simply wouldn't fit before the day closes or
  // before the next existing booking — e.g. only a 30-min service should
  // be selectable at the very last slot of the day.
  const maxFitMinutes = useMemo(() => {
    if (!selectedSlot) return 0;
    let total = 0;
    let cursor: AvailabilitySlot | undefined = selectedSlot;
    while (cursor && !cursor.is_booked) {
      total += (new Date(cursor.end_time).getTime() - new Date(cursor.start_time).getTime()) / 60000;
      const cursorEndMs = new Date(cursor.end_time).getTime();
      cursor = localSlots.find((s) => new Date(s.start_time).getTime() === cursorEndMs);
    }
    return total;
  }, [selectedSlot, localSlots]);

  // If the selected time changes and a previously-ticked treatment no
  // longer fits, automatically un-tick it rather than leaving a stale,
  // now-invalid selection.
  useEffect(() => {
    if (!selectedSlot) return;
    setSelectedServiceIds((prev) =>
      prev.filter((id) => {
        const service = services.find((s) => s.id === id);
        return service ? (service.duration_minutes || 30) <= maxFitMinutes : true;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlotId]);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  const selectedTotal = services
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const selectedDuration = services
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + (s.duration_minutes || 30), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlotId) return;
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlotId,
          serviceIds: selectedServiceIds,
          name,
          email,
          phone,
          notes,
          voucherCode: voucherCode || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.suggestedStart) {
          // The chosen time doesn't have enough free room for the selected
          // services — offer to jump straight to the next time that fits.
          const suggestedSlot = localSlots.find((s) => s.start_time === data.suggestedStart);
          if (suggestedSlot) setSelectedSlotId(suggestedSlot.id);
        }
        // Note: we deliberately never close the modal here (even on a
        // genuine conflict with no suggestion) — closing it would hide
        // the error message below instead of showing it to the customer.
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setVoucherApplied(data.voucherApplied ?? null);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-plum/40 px-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-md rounded-2xl bg-blush-light p-8 text-center shadow-xl">
          <h2 className="font-display text-2xl text-plum">Booking confirmed ✨</h2>
          <p className="mt-3 font-body text-plum/80">
            A confirmation email is on its way to {email}. We can&apos;t wait to see you.
          </p>
          {voucherApplied != null && voucherApplied > 0 && (
            <p className="mt-3 font-body text-sm text-plum/70">
              €{voucherApplied.toFixed(2)} from your gift voucher was applied to this booking.
            </p>
          )}
        </div>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-plum/40 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-booking-heading"
        >
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-blush-light p-6 shadow-xl md:p-8">
            <button
              type="button"
              onClick={() => setSelectedSlotId(null)}
              aria-label="Close"
              className="absolute right-4 top-4 text-plum/60 transition-colors hover:text-maroon"
            >
              ✕
            </button>

            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 id="confirm-booking-heading" className="pr-6 font-display text-xl text-plum">
                Confirm your slot — {format(new Date(selectedSlot.start_time), "EEEE d MMMM, h:mmaaa")}
              </h3>

              {services.length > 0 && (
                <div>
                  <label className="mb-2 block font-body text-sm text-plum">
                    Treatments (select as many as you&apos;d like)
                  </label>
                  <div className="max-h-80 space-y-4 overflow-y-auto rounded-2xl border border-rose bg-white p-3">
                    {categories.map((cat) => {
                      const itemsInCategory = services.filter((s) => s.category_id === cat.id);
                      if (itemsInCategory.length === 0) return null;
                      return (
                        <div key={cat.id}>
                          <p className="mb-1 font-display text-sm text-mauve">{cat.name}</p>
                          <div className="space-y-1">
                            {itemsInCategory.map((s) => {
                              const duration = s.duration_minutes || 30;
                              const fits = duration <= maxFitMinutes;
                              return (
                                <label
                                  key={s.id}
                                  className={`flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 ${
                                    fits ? "cursor-pointer hover:bg-blush" : "cursor-not-allowed opacity-40"
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedServiceIds.includes(s.id)}
                                      onChange={() => toggleService(s.id)}
                                      disabled={!fits}
                                      className="h-4 w-4 accent-glow"
                                    />
                                    <span className="font-body text-sm text-plum">
                                      {s.name}
                                      {!fits && (
                                        <span className="ml-1 text-xs text-plum/60">
                                          (not enough time left today)
                                        </span>
                                      )}
                                    </span>
                                  </span>
                                  <span className="font-body text-sm text-plum/70">€{s.price.toFixed(2)}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedServiceIds.length > 0 && (
                    <p className="mt-2 text-right font-body text-sm text-plum">
                      Estimated total: <span className="font-semibold">€{selectedTotal.toFixed(2)}</span>
                      {" · "}
                      Approx. <span className="font-semibold">{selectedDuration} mins</span>
                    </p>
                  )}
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
              <input
                type="text"
                placeholder="Gift voucher code (optional)"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body uppercase text-plum placeholder:text-plum/40 placeholder:normal-case focus:border-glow focus:outline-none"
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
          </div>
        </div>
      )}
    </div>
  );
}
