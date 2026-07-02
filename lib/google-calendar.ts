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

export async function deleteCalendarEvent(eventId: string) {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  await calendar.events.delete({ calendarId, eventId }).catch(() => {
    // Event may already be gone — not fatal.
  });
}
