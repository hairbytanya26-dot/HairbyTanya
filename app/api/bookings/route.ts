import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendEmail, fillTemplate } from "@/lib/email";
import { format } from "date-fns";

export async function POST(request: Request) {
  try {
    const { slotId, serviceId, name, email, phone, notes } = await request.json();

    if (!slotId || !name || !email) {
      return NextResponse.json({ error: "Missing required booking details." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Re-check the slot is still free right before booking — closes the
    // race condition where two people pick the same slot at once.
    const { data: slot, error: slotError } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("id", slotId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: "That slot no longer exists." }, { status: 404 });
    }
    if (slot.is_booked) {
      return NextResponse.json(
        { error: "Sorry, that slot was just booked by someone else. Please pick another." },
        { status: 409 }
      );
    }

    let serviceName = "Appointment";
    if (serviceId) {
      const { data: service } = await supabase
        .from("price_items")
        .select("name")
        .eq("id", serviceId)
        .single();
      if (service) serviceName = service.name;
    }

    // Claim the slot first (atomic-ish guard against double booking)
    const { error: claimError } = await supabase
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", slotId)
      .eq("is_booked", false);

    if (claimError) {
      return NextResponse.json({ error: "Could not reserve that slot. Please try again." }, { status: 500 });
    }

    // Push to Google Calendar
    let googleEventId: string | null = null;
    try {
      googleEventId =
        (await createCalendarEvent({
          summary: `${serviceName} — ${name}`,
          description: `Booked via website.\nCustomer: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nNotes: ${notes || "—"}`,
          startTime: slot.start_time,
          endTime: slot.end_time,
          attendeeEmail: email,
        })) ?? null;
    } catch (calendarError) {
      console.error("Google Calendar sync error", calendarError);
      // Booking still proceeds even if calendar sync fails — it's recorded
      // in Supabase and visible in the admin panel either way.
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        slot_id: slotId,
        service_id: serviceId || null,
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
      return NextResponse.json({ error: "Could not save your booking. Please try again." }, { status: 500 });
    }

    if (googleEventId) {
      await supabase.from("availability_slots").update({ google_event_id: googleEventId }).eq("id", slotId);
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
          service: serviceName,
          date: format(new Date(slot.start_time), "EEEE d MMMM yyyy"),
          time: format(new Date(slot.start_time), "h:mmaaa"),
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
