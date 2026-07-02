export default function GoogleSetupPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-plum">Google Calendar</h1>
      <p className="mt-2 text-plum/70">
        Connect the site to your business Gmail account&apos;s calendar so bookings sync automatically.
      </p>

      <div className="mt-8 rounded-2xl bg-white/70 p-6">
        <h2 className="font-display text-lg text-mauve">One-time setup</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-plum/90">
          <li>
            Make sure <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code> and{" "}
            <code>GOOGLE_REDIRECT_URI</code> are set in your Netlify environment variables (see README).
          </li>
          <li>Click the button below and sign in with your business Gmail account.</li>
          <li>
            You will land on a page showing a long code — copy it into Netlify as{" "}
            <code>GOOGLE_REFRESH_TOKEN</code>, then redeploy the site.
          </li>
          <li>That&apos;s it — new bookings will now appear automatically on that Google Calendar.</li>
        </ol>

        <a
          href="/api/google/auth"
          className="mt-6 inline-block rounded-full bg-plum px-6 py-2.5 text-blush transition-colors hover:bg-glow"
        >
          Connect Google Calendar
        </a>
      </div>
    </div>
  );
}
