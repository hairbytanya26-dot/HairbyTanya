import { createAdminClient } from "@/lib/supabase/admin";
import { dublinTimeToUTCDate, getTodayDublinDateString, addDaysToDateString, dayOfWeekForDateString } from "@/lib/dublinTime";

const WEEKS_AHEAD = 6;
const SLOT_LENGTH_MINS = 15;

/**
 * Ensures availability_slots exist, for every day in the rolling 6-week
 * window, that falls on an active working day (per the working_hours
 * table). Days that already have slots are left untouched — this only
 * fills in gaps, so it's safe to call on every page load.
 */
export async function ensureSlotsGenerated(): Promise<void> {
  const supabase = createAdminClient();

  const { data: workingHours } = await supabase
    .from("working_hours")
    .select("*")
    .eq("is_active", true);

  if (!workingHours || workingHours.length === 0) return;

  const byDayOfWeek = new Map(workingHours.map((w) => [w.day_of_week, w]));

  const today = getTodayDublinDateString();
  const horizonDays = WEEKS_AHEAD * 7;

  const newSlots: { start_time: string; end_time: string }[] = [];

  for (let i = 0; i < horizonDays; i++) {
    const dateStr = addDaysToDateString(today, i);
    const dow = dayOfWeekForDateString(dateStr);
    const hours = byDayOfWeek.get(dow);
    if (!hours) continue; // not a working day

    // Skip if this day already has any slots — only fill genuine gaps.
    const dayStart = dublinTimeToUTCDate(dateStr, 0, 0);
    const dayEnd = dublinTimeToUTCDate(dateStr, 23, 59);
    const { count } = await supabase
      .from("availability_slots")
      .select("id", { count: "exact", head: true })
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString());

    if (count && count > 0) continue;

    const [startH, startM] = hours.start_time.split(":").map(Number);
    const [endH, endM] = hours.end_time.split(":").map(Number);
    const windowStart = dublinTimeToUTCDate(dateStr, startH, startM);
    const windowEnd = dublinTimeToUTCDate(dateStr, endH, endM);

    let cursor = windowStart;
    while (cursor < windowEnd) {
      const slotEnd = new Date(cursor.getTime() + SLOT_LENGTH_MINS * 60000);
      if (slotEnd > windowEnd) break;
      newSlots.push({ start_time: cursor.toISOString(), end_time: slotEnd.toISOString() });
      cursor = slotEnd;
    }
  }

  if (newSlots.length > 0) {
    await supabase.from("availability_slots").insert(newSlots);
  }
}
