// Converts a wall-clock date+time as understood in Europe/Dublin into the
// correct UTC Date, regardless of what timezone the browser/server actually
// runs in. Handles Irish Summer Time automatically.
export function dublinTimeToUTCDate(dateStr: string, hours: number, minutes: number): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  // First guess: treat the wall-clock time as if it were UTC.
  const guess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

  // Ask what that instant reads as in Dublin, to find the current offset.
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

  return new Date(guess.getTime() - offsetMs);
}

// Returns today's calendar date in Dublin, as "YYYY-MM-DD", regardless of
// what timezone the server happens to be running in.
export function getTodayDublinDateString(): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Dublin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(new Date()); // en-CA formats as YYYY-MM-DD
}

// Adds `days` calendar days to a "YYYY-MM-DD" string and returns the result
// in the same format. Pure calendar-date arithmetic, timezone-independent.
export function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Day-of-week (0=Sunday..6=Saturday) for a "YYYY-MM-DD" string. This is a
// property of the calendar date itself, not a specific moment in time, so
// no timezone conversion is needed here.
export function dayOfWeekForDateString(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
