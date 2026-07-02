import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-calendar";

// Visit /api/google/auth while logged into the admin panel to start the
// one-time authorization that lets the site create Google Calendar events.
export async function GET() {
  return NextResponse.redirect(getAuthUrl());
}
