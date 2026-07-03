import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteCalendarEvent } from "@/lib/google-calendar";

export async function POST(request: Request) {
  // Confirm the caller is a signed-in admin before touching anything.
  const authClient = createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { bookingId } = await request.json();
  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.google_event_id) {
    await deleteCalendarEvent(booking.google_event_id).catch(() => {});
  }
  if (booking.second_event_id) {
    await deleteCalendarEvent(booking.second_event_id).catch(() => {});
  }

  // Release exactly the slots this booking claimed. Split bookings (colour
  // + finishing service) leave a 30-minute gap in between that's NOT part
  // of this booking — another customer may have legitimately booked a
  // short appointment into that gap, so we must never release by a blanket
  // start/end time range, only by the specific slots this booking tagged
  // with its own calendar event id(s).
  if (booking.google_event_id || booking.second_event_id) {
    const eventIds = [booking.google_event_id, booking.second_event_id].filter(Boolean);
    await supabase
      .from("availability_slots")
      .update({ is_booked: false, google_event_id: null })
      .in("google_event_id", eventIds as string[]);
  } else if (booking.start_time && booking.end_time) {
    // Calendar sync must have failed for this booking, so slots weren't
    // tagged with an event id — fall back to the time range (safe for
    // ordinary non-split bookings; a split booking in this rare case
    // would need manual review in the admin panel).
    await supabase
      .from("availability_slots")
      .update({ is_booked: false, google_event_id: null })
      .gte("start_time", booking.start_time)
      .lt("start_time", booking.end_time);
  } else {
    // Fallback for any older booking made before start_time/end_time existed.
    await supabase
      .from("availability_slots")
      .update({ is_booked: false, google_event_id: null })
      .eq("id", booking.slot_id);
  }

  await supabase.from("bookings").delete().eq("id", bookingId);

  return NextResponse.json({ success: true });
}
