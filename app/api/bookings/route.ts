import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";
import { sendEmail, fillTemplate } from "@/lib/email";
import { format } from "date-fns";

const MS_PER_MIN = 60000;
const GAP_MINUTES = 30;

// Categories that need to go FIRST, with a 30-minute processing gap
// before any "finishing" service. Matched by category name. Anything not
// in this set (including the finishing categories themselves, and any
// future custom category) is treated as a finishing-group service.
const COLOUR_CATEGORIES = new Set(["Colour Bar", "Blonde Bar", "Balayage", "Face Frame"]);

type Slot = { id: string; start_time: string; end_time: string; is_booked: boolean };

// Finds the contiguous, gap-free, unbooked chain of slots starting at
// `fromSlot` that together cover at least `durationMins`.
function findRun(
  fromSlot: Slot,
  durationMins: number,
  slots: Slot[]
): { ids: string[]; endTime: string } | null {
  if (fromSlot.is_booked) return null;
  if (durationMins <= 0) return { ids: [], endTime: fromSlot.start_time };
  const neededEndMs = new Date(fromSlot.start_time).getTime() + durationMins * MS_PER_MIN;
  let cursor = fromSlot;
  const ids = [fromSlot.id];
  while (new Date(cursor.end_time).getTime() < neededEndMs) {
    const cursorEndMs = new Date(cursor.end_time).getTime();
    // Compare by actual instant, not raw string — Postgres and JS don't
    // always format identical timestamps the same way character-for-character.
    const next = slots.find((s) => new Date(s.start_time).getTime() === cursorEndMs);
    if (!next || next.is_booked) return null;
    ids.push(next.id);
    cursor = next;
  }
  return { ids, endTime: cursor.end_time };
}

// For a "split" booking (a colour service + a finishing service), finds
// block 1 (colour) starting at fromSlot, then a mandatory 30-minute gap
// (left untouched — other customers can still book short slots in it),
// then block 2 (finishing) immediately after the gap.
function findSplitRun(
  fromSlot: Slot,
  durationA: number,
  durationB: number,
  slots: Slot[]
): { block1: { ids: string[]; endTime: string }; block2: { ids: string[]; endTime: string } } | null {
  const block1 = findRun(fromSlot, durationA, slots);
  if (!block1) return null;

  const block2StartMs = new Date(block1.endTime).getTime() + GAP_MINUTES * MS_PER_MIN;
  const block2StartSlot = slots.find((s) => new Date(s.start_time).getTime() === block2StartMs);
  if (!block2StartSlot) return null;

  const block2 = findRun(block2StartSlot, durationB, slots);
  if (!block2) return null;

  return { block1, block2 };
}

export async function POST(request: Request) {
  try {
    const { slotId, serviceIds, name, email, phone, notes } = await request.json();

    if (!slotId || !name || !email) {
      return NextResponse.json({ error: "Missing required booking details." }, { status: 400 });
    }

    const selectedServiceIds: string[] = Array.isArray(serviceIds) ? serviceIds.filter(Boolean) : [];

    const supabase = createAdminClient();

    const { data: startSlot, error: slotError } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("id", slotId)
      .single();

    if (slotError || !startSlot) {
      return NextResponse.json({ error: "That slot no longer exists." }, { status: 404 });
    }

    // Work out required duration, split by colour vs finishing services.
    let durationColour = 0;
    let durationFinishing = 0;
    const colourNames: string[] = [];
    const finishingNames: string[] = [];

    if (selectedServiceIds.length > 0) {
      const { data: services, error: servicesFetchError } = await supabase
        .from("price_items")
        .select("id, name, duration_minutes, category_id")
        .in("id", selectedServiceIds);

      if (servicesFetchError) {
        console.error("price_items fetch error", servicesFetchError);
      }

      if (services && services.length > 0) {
        const categoryIds = Array.from(new Set(services.map((s) => s.category_id).filter(Boolean)));
        const { data: categories, error: categoriesFetchError } = await supabase
          .from("price_categories")
          .select("id, name")
          .in("id", categoryIds);

        if (categoriesFetchError) {
          console.error("price_categories fetch error", categoriesFetchError);
        }

        const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

        for (const s of services) {
          const dur = s.duration_minutes || 30;
          const categoryName = s.category_id ? categoryNameById.get(s.category_id) : undefined;
          const isColour = categoryName ? COLOUR_CATEGORIES.has(categoryName) : false;
          if (isColour) {
            durationColour += dur;
            colourNames.push(s.name);
          } else {
            durationFinishing += dur;
            finishingNames.push(s.name);
          }
        }
      }
    }

    const isSplit = durationColour > 0 && durationFinishing > 0;
    const totalActiveDuration = durationColour + durationFinishing;
    const nominalSlotLength =
      (new Date(startSlot.end_time).getTime() - new Date(startSlot.start_time).getTime()) / MS_PER_MIN;
    // No services selected — fall back to the picked slot's own nominal length.
    const singleDuration = totalActiveDuration > 0 ? totalActiveDuration : nominalSlotLength;

    const allNames = [...colourNames, ...finishingNames];
    const serviceSummary = allNames.length > 0 ? allNames.join(", ") : "Appointment";

    // Load every upcoming slot so we can check for free contiguous runs,
    // and — if the requested time doesn't work — scan ahead for a suggestion.
    const { data: allSlots } = await supabase
      .from("availability_slots")
      .select("*")
      .gte("start_time", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("start_time", { ascending: true });

    const slots: Slot[] = allSlots ?? [];

    const trySlot = (candidate: Slot) =>
      isSplit ? findSplitRun(candidate, durationColour, durationFinishing, slots) : findRun(candidate, singleDuration, slots);

    const result = trySlot(startSlot);

    if (!result) {
      const laterSlots = slots.filter(
        (s) => new Date(s.start_time).getTime() >= new Date(startSlot.start_time).getTime() && !s.is_booked
      );
      let suggestedStart: string | null = null;
      for (const candidate of laterSlots) {
        if (trySlot(candidate)) {
          suggestedStart = candidate.start_time;
          break;
        }
      }

      const neededDescription = isSplit
        ? `${durationColour} minutes, a ${GAP_MINUTES}-minute processing gap, then ${durationFinishing} minutes`
        : `${singleDuration} minutes`;

      return NextResponse.json(
        {
          error: suggestedStart
            ? `That combination needs ${neededDescription}, which runs into an existing booking. The next available time that fits is ${format(
                new Date(suggestedStart),
                "EEEE d MMMM, h:mmaaa"
              )}.`
            : `That combination needs ${neededDescription}, which runs into an existing booking, and no later slot currently open fits it either. Please choose fewer services or check back once more availability is added.`,
          suggestedStart,
        },
        { status: 409 }
      );
    }

    // Collect the slot ids to actually claim. For a split booking, the
    // 30-minute gap between blocks is deliberately NOT included, so other
    // customers can still book a short (<=30 min) appointment in it.
    const isSplitResult = "block1" in result;
    const claimIds = isSplitResult ? [...result.block1.ids, ...result.block2.ids] : result.ids;
    const bookingStart = startSlot.start_time;
    const bookingEnd = isSplitResult ? result.block2.endTime : result.endTime;

    const { data: claimed, error: claimError } = await supabase
      .from("availability_slots")
      .update({ is_booked: true })
      .in("id", claimIds)
      .eq("is_booked", false)
      .select("id");

    if (claimError || !claimed || claimed.length !== claimIds.length) {
      if (claimed && claimed.length > 0) {
        await supabase.from("availability_slots").update({ is_booked: false }).in(
          "id",
          claimed.map((c) => c.id)
        );
      }
      return NextResponse.json(
        { error: "Sorry, part of that time was just booked by someone else. Please try again." },
        { status: 409 }
      );
    }

    // Push to Google Calendar — two separate events for a split booking
    // (so the gap visibly shows as free on the calendar), one otherwise.
    let googleEventId: string | null = null;
    let secondEventId: string | null = null;

    try {
      if (isSplitResult) {
        googleEventId =
          (await createCalendarEvent({
            summary: `${colourNames.join(", ")} — ${name}`,
            description: `Booked via website.\nCustomer: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nColour service(s): ${colourNames.join(", ")}\nFollowed by a ${GAP_MINUTES}-min gap, then: ${finishingNames.join(", ")}\nNotes: ${notes || "—"}`,
            startTime: bookingStart,
            endTime: result.block1.endTime,
            attendeeEmail: email,
          })) ?? null;

        const block2Start = slots.find((s) => s.id === result.block2.ids[0])?.start_time ?? result.block1.endTime;
        secondEventId =
          (await createCalendarEvent({
            summary: `${finishingNames.join(", ")} — ${name}`,
            description: `Booked via website.\nCustomer: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nFinishing service(s): ${finishingNames.join(", ")} (after colour processing gap)\nNotes: ${notes || "—"}`,
            startTime: block2Start,
            endTime: result.block2.endTime,
            attendeeEmail: email,
          })) ?? null;
      } else {
        googleEventId =
          (await createCalendarEvent({
            summary: `${serviceSummary} — ${name}`,
            description: `Booked via website.\nCustomer: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nServices: ${serviceSummary}\nDuration: ${singleDuration} mins\nNotes: ${notes || "—"}`,
            startTime: bookingStart,
            endTime: bookingEnd,
            attendeeEmail: email,
          })) ?? null;
      }
    } catch (calendarError) {
      console.error("Google Calendar sync error", calendarError);
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        slot_id: startSlot.id,
        service_id: null,
        start_time: bookingStart,
        end_time: bookingEnd,
        total_duration_minutes: (new Date(bookingEnd).getTime() - new Date(bookingStart).getTime()) / MS_PER_MIN,
        customer_name: name,
        customer_email: email,
        customer_phone: phone || null,
        notes: notes || null,
        google_event_id: googleEventId,
        second_event_id: secondEventId,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("booking insert error", bookingError);
      await supabase.from("availability_slots").update({ is_booked: false }).in("id", claimIds);
      if (googleEventId) await deleteCalendarEvent(googleEventId).catch(() => {});
      if (secondEventId) await deleteCalendarEvent(secondEventId).catch(() => {});
      return NextResponse.json(
        {
          error: "Could not save your booking. Please try again, or contact us directly.",
          debug: bookingError.message,
        },
        { status: 500 }
      );
    }

    if (selectedServiceIds.length > 0) {
      const rows = selectedServiceIds.map((service_id) => ({ booking_id: booking.id, service_id }));
      const { error: servicesError } = await supabase.from("booking_services").insert(rows);
      if (servicesError) console.error("booking_services insert error", servicesError);
    }

    if (googleEventId || secondEventId) {
      // Tag block1 slots with the first event id and block2 slots with the
      // second, so cancellation can clean up correctly.
      if (isSplitResult) {
        if (googleEventId) {
          await supabase.from("availability_slots").update({ google_event_id: googleEventId }).in("id", result.block1.ids);
        }
        if (secondEventId) {
          await supabase.from("availability_slots").update({ google_event_id: secondEventId }).in("id", result.block2.ids);
        }
      } else if (googleEventId) {
        await supabase.from("availability_slots").update({ google_event_id: googleEventId }).in("id", claimIds);
      }
    }

    // Send admin-customisable confirmation email
    const { data: template } = await supabase
      .from("email_templates")
      .select("subject, body_html")
      .eq("template_key", "booking_confirmation")
      .single();

    if (template) {
      try {
        const vars = {
          name,
          service: serviceSummary,
          date: format(new Date(bookingStart), "EEEE d MMMM yyyy"),
          time: format(new Date(bookingStart), "h:mmaaa"),
        };
        await sendEmail({
          to: email,
          subject: fillTemplate(template.subject, vars),
          html: fillTemplate(template.body_html, vars),
        });
        await supabase.from("bookings").update({ confirmation_email_sent: true }).eq("id", booking.id);
      } catch (emailError) {
        console.error("confirmation email send error", emailError);
      }
    }

    return NextResponse.json({ success: true, bookingId: booking.id });
  } catch (err) {
    console.error("bookings route error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
