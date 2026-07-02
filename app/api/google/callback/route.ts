import { NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code." }, { status: 400 });
  }

  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token) {
    return new NextResponse(
      `<p>No refresh token was returned. This usually means you've authorized this app before.
       Go to <a href="https://myaccount.google.com/permissions" target="_blank">Google Account permissions</a>,
       remove access for this app, then try <a href="/api/google/auth">/api/google/auth</a> again.</p>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Shown once, directly in the browser — never logged or stored server-side.
  // Copy this value into GOOGLE_REFRESH_TOKEN in your Netlify environment variables.
  return new NextResponse(
    `<html><body style="font-family: sans-serif; max-width: 600px; margin: 40px auto; line-height: 1.6;">
      <h2>Google Calendar connected ✅</h2>
      <p>Copy the value below and add it as <code>GOOGLE_REFRESH_TOKEN</code> in your Netlify environment
      variables, then redeploy. This page will not show this value again.</p>
      <textarea readonly style="width:100%; height:80px; font-family: monospace; padding: 8px;">${tokens.refresh_token}</textarea>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
