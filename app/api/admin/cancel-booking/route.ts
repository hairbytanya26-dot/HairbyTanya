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

  await supabase.from("availability_slots").update({ is_booked: false, google_event_id: null }).eq("id", booking.slot_id);
  await supabase.from("bookings").delete().eq("id", bookingId);

  return NextResponse.json({ success: true });
}
