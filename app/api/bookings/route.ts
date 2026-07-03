import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendEmail, fillTemplate } from "@/lib/email";
import { format } from "date-fns";

const MS_PER_MIN = 60000;

export async function POST(request: Request) {
  try {
    const { slotId, serviceIds, name, email, phone, notes } = await request.json();

    if (!slotId || !name || !email) {
      return NextResponse.json({ error: "Missing required booking details." }, { status: 400 });
    }

    const selectedServiceIds: string[] = Array.isArray(serviceIds) ? serviceIds.filter(Boolean) : [];

    const supabase = createAdminClient();

    // Fetch the requested starting slot
    const { data: startSlot, error: slotError } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("id", slotId)
      .single();

    if (slotError || !startSlot) {
      return NextResponse.json({ error: "That slot no longer exists." }, { status: 404 });
    }

    // Work out total required duration from the selected services.
    let totalDuration = 0;
    let serviceNames: string[] = [];
    if (selectedServiceIds.length > 0) {
      const { data: services } = await supabase
        .from("price_items")
        .select("id, name, duration_minutes")
        .in("id", selectedServiceIds);
      if (services) {
        serviceNames = services.map((s) => s.name);
        totalDuration = services.reduce((sum, s) => sum + (s.duration_minutes || 30), 0);
      }
    }
    // No services selected — fall back to the picked slot's own nominal length.
    if (totalDuration === 0) {
      totalDuration =
        (new Date(startSlot.end_time).getTime() - new Date(startSlot.start_time).getTime()) / MS_PER_MIN;
    }
    const serviceSummary = serviceNames.length > 0 ? serviceNames.join(", ") : "Appointment";

    // Load every upcoming slot (same and later days) so we can check for a
    // contiguous, unbroken, unbooked run covering the full duration, and —
    // if that fails — scan ahead for the next start time that does work.
    const { data: allSlots } = await supabase
      .from("availability_slots")
      .select("*")
      .gte("start_time", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("start_time", { ascending: true });

    const slots = allSlots ?? [];

    // Finds the contiguous, gap-free, unbooked chain of slots starting at
    // `fromSlot` that together cover at least `durationMins`. Returns the
    // list of slot ids to consume, or null if it doesn't fit.
    const findRun = (fromSlot: typeof startSlot, durationMins: number): { ids: string[]; endTime: string } | null => {
      if (fromSlot.is_booked) return null;
      const neededEndMs = new Date(fromSlot.start_time).getTime() + durationMins * MS_PER_MIN;
      let cursor = fromSlot;
      const ids = [fromSlot.id];
      while (new Date(cursor.end_time).getTime() < neededEndMs) {
        const next = slots.find((s) => s.start_time === cursor.end_time);
        if (!next || next.is_booked) return null;
        ids.push(next.id);
        cursor = next;
      }
      return { ids, endTime: cursor.end_time };
    };

    const run = findRun(startSlot, totalDuration);

    if (!run) {
      // Look for the next slot (chronologically, same or later) where the
      // full duration actually fits, to offer as a suggestion.
      const laterSlots = slots.filter(
        (s) => new Date(s.start_time).getTime() >= new Date(startSlot.start_time).getTime() && !s.is_booked
      );
      let suggestion: { start: string; ids: string[] } | null = null;
      for (const candidate of laterSlots) {
        const candidateRun = findRun(candidate, totalDuration);
        if (candidateRun) {
          suggestion = { start: candidate.start_time, ids: candidateRun.ids };
          break;
        }
      }

      return NextResponse.json(
        {
          error: suggestion
            ? `That combination needs ${totalDuration} minutes, which runs into an existing booking. The next available time that fits is ${format(
                new Date(suggestion.start),
                "EEEE d MMMM, h:mmaaa"
              )}.`
            : `That combination needs ${totalDuration} minutes, which runs into an existing booking, and no later slot currently open fits it either. Please choose fewer services or check back once more availability is added.`,
          suggestedStart: suggestion?.start ?? null,
        },
        { status: 409 }
      );
    }

    // Claim every slot in the run (guards against a double-booking race —
    // if any of these got taken in the meantime, this update affects 0 rows
    // for that id and we catch it via the mismatch check below).
    const { data: claimed, error: claimError } = await supabase
      .from("availability_slots")
      .update({ is_booked: true })
      .in("id", run.ids)
      .eq("is_booked", false)
      .select("id");

    if (claimError || !claimed || claimed.length !== run.ids.length) {
      // Roll back any that did get claimed, since the full run isn't secured.
      if (claimed && claimed.length > 0) {
        await supabase
          .from("availability_slots")
          .update({ is_booked: false })
          .in("id", claimed.map((c) => c.id));
      }
      return NextResponse.json(
        { error: "Sorry, part of that time was just booked by someone else. Please try again." },
        { status: 409 }
      );
    }

    const bookingStart = startSlot.start_time;
    const bookingEnd = run.endTime;

    // Push to Google Calendar using the REAL computed duration
    let googleEventId: string | null = null;
    try {
      googleEventId =
        (await createCalendarEvent({
          summary: `${serviceSummary} — ${name}`,
          description: `Booked via website.\nCustomer: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nServices: ${serviceSummary}\nDuration: ${totalDuration} mins\nNotes: ${notes || "—"}`,
          startTime: bookingStart,
          endTime: bookingEnd,
          attendeeEmail: email,
        })) ?? null;
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
        total_duration_minutes: totalDuration,
        customer_name: name,
        customer_email: email,
        customer_phone: phone || null,
        notes: notes || null,
        google_event_id: googleEventId,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("booking insert error", bookingError);
      // Release the claimed slots since the booking row failed to save.
      await supabase.from("availability_slots").update({ is_booked: false }).in("id", run.ids);
      return NextResponse.json({ error: "Could not save your booking. Please try again." }, { status: 500 });
    }

    if (selectedServiceIds.length > 0) {
      const rows = selectedServiceIds.map((service_id) => ({ booking_id: booking.id, service_id }));
      const { error: servicesError } = await supabase.from("booking_services").insert(rows);
      if (servicesError) console.error("booking_services insert error", servicesError);
    }

    if (googleEventId) {
      await supabase
        .from("availability_slots")
        .update({ google_event_id: googleEventId })
        .in("id", run.ids);
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
