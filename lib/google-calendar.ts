import { google } from "googleapis";

// Uses a one-time-obtained OAuth refresh token (see /admin/google-setup and
// /api/google/auth) so the site can create calendar events without the
// business owner needing to log in again on every request.
export function getOAuth2Client() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  }

  return client;
}

export function getAuthUrl() {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // forces a refresh_token to be returned even on repeat auth
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  });
}

export async function createCalendarEvent({
  summary,
  description,
  startTime,
  endTime,
  attendeeEmail,
}: {
  summary: string;
  description: string;
  startTime: string; // ISO
  endTime: string; // ISO
  attendeeEmail: string;
}) {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });

  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description,
      start: { dateTime: startTime, timeZone: "Europe/Dublin" },
      end: { dateTime: endTime, timeZone: "Europe/Dublin" },
      attendees: [{ email: attendeeEmail }],
    },
    sendUpdates: "none", // we send our own branded confirmation email instead
  });

  return data.id;
}

export async function createBirthdayCalendarEvent({
  name,
  email,
  day,
  month,
}: {
  name: string;
  email: string;
  day: number;
  month: number;
}) {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  // A timed 7:00am event, repeating every year. Using a named timeZone
  // (rather than a fixed UTC offset) means Google Calendar automatically
  // handles Irish Summer Time correctly for every future occurrence, the
  // same way a recurring 7am event should behave regardless of the year.
  const year = new Date().getFullYear();
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `🎂 ${name}'s Birthday — send voucher!`,
      description: `Mailing list birthday reminder.\nName: ${name}\nEmail: ${email}\n\nConsider sending them a birthday voucher from the admin panel.`,
      start: { dateTime: `${dateStr}T07:00:00`, timeZone: "Europe/Dublin" },
      end: { dateTime: `${dateStr}T07:30:00`, timeZone: "Europe/Dublin" },
      recurrence: ["RRULE:FREQ=YEARLY"],
    },
    sendUpdates: "none", // internal reminder only — no invite sent to the customer
  });

  return data.id;
}

export async function deleteCalendarEvent(eventId: string) {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  await calendar.events.delete({ calendarId, eventId }).catch(() => {
    // Event may already be gone — not fatal.
  });
}
