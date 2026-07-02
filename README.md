# Hair by Tanya — website

Next.js 14 + Supabase + Netlify. Fully editable from `/admin` — no code changes
needed for day-to-day updates (price list, socials, reviews, email wording,
booking slots, homepage text).

## 1. Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values, see below
npm run dev
```

## 2. Supabase

1. Create a new project at supabase.com (or use your existing one, kept separate from your other apps).
2. Project Settings → API → copy the **Project URL**, **anon public** key, and **service_role** key into `.env.local`.
3. SQL Editor → New query → paste the entire contents of `supabase/schema.sql` → Run.
   This creates every table, default rows, and the Row Level Security policies.
4. Authentication → Users → **Add user** → create yourself an admin login (email + password).
   This is what you'll use to sign into `/admin`. Anyone with a login here has full
   admin access, so only create accounts you trust.

## 3. Gmail (automated emails)

1. Create the new Gmail account for the business.
2. Turn on 2-Step Verification: Google Account → Security → 2-Step Verification.
3. Google Account → Security → App passwords → generate one for "Mail" → copy it.
4. In `.env.local` / Netlify env vars:
   - `GMAIL_USER` = the Gmail address
   - `GMAIL_APP_PASSWORD` = the app password (not your normal Gmail password)
   - `GMAIL_FROM_NAME` = e.g. `Hair by Tanya`

## 4. Google Calendar (bookings)

1. console.cloud.google.com → sign in with the business Gmail → New Project.
2. Enable **Google Calendar API**.
3. OAuth consent screen → External → fill in app name/email → add yourself as a test user.
4. Credentials → Create Credentials → OAuth client ID → Web application.
   - Authorized redirect URIs: add both
     `http://localhost:3000/api/google/callback` and
     `https://YOUR-NETLIFY-SITE.netlify.app/api/google/callback`
5. Copy the **Client ID** and **Client Secret** into `.env.local` / Netlify as
   `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Set `GOOGLE_REDIRECT_URI` to
   match whichever URL you're running against.
6. Run the app, log into `/admin`, go to **Google Calendar** in the sidebar,
   click **Connect Google Calendar**, sign in, and copy the refresh token shown
   into `GOOGLE_REFRESH_TOKEN`. Redeploy.

## 5. Deploy to Netlify

1. Push this repo to GitHub.
2. Netlify → Add new site → Import an existing project → pick the repo.
3. Build command: `npm run build` — Netlify auto-detects the Next.js plugin.
4. Site settings → Environment variables → add everything from `.env.example`
   with real values (use your Netlify URL for `GOOGLE_REDIRECT_URI` and add
   that URL to the Google OAuth client's redirect URIs too).
5. Deploy. Once live, redo step 4.6 above using the live URL if you didn't
   already, since the refresh token flow needs a reachable redirect URI.

## Editing content day-to-day

Everything below is done at `/admin` (sign in with the Supabase user you created):

- **Site Text** — homepage hero/about wording, booking page notice, contact details
- **Price List** — categories and treatments, prices, durations, show/hide
- **Social Links** — add/remove footer icons and their destination URLs
- **Reviews** — add/edit/remove client reviews
- **Availability & Bookings** — generate open slots for a day, see who's booked, cancel bookings
- **Mailing List** — view/export subscribers
- **Email Templates** — edit the wording of the welcome email and booking confirmation email
- **Google Calendar** — one-time connection screen

## Project structure

```
app/                    Public pages + admin panel + API routes
  page.tsx              Homepage
  pricelist/ reviews/ bookings/   Public nav pages
  admin/                 Admin panel (password protected)
  api/                    Server routes: mailing-list signup, bookings, Google OAuth
components/             Shared UI (nav, footer, popup, booking widget, admin forms)
lib/                    Supabase clients, email sending, Google Calendar wrapper, types
supabase/schema.sql     Full DB schema + RLS policies — run once in Supabase SQL Editor
```
