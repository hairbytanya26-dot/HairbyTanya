"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "ng_mailing_list_dismissed";
const POPUP_DELAY_MS = 1500;

export default function MailingListPopup() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const dismissed = window.localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), POPUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function close() {
    setVisible(false);
    window.localStorage.setItem(DISMISS_KEY, "1");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/mailing-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mailing-list-heading"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-blush-light p-8 shadow-xl">
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 text-plum/60 transition-colors hover:text-maroon"
        >
          ✕
        </button>

        {status === "success" ? (
          <div className="py-6 text-center">
            <h2 className="font-display text-2xl text-plum">You&apos;re on the list! ✨</h2>
            <p className="mt-3 font-body text-plum/80">
              Keep an eye on your inbox — specials and discounts land there first.
            </p>
            <button
              onClick={close}
              className="mt-6 rounded-full bg-plum px-6 py-2 font-body text-blush transition-colors hover:bg-glow"
            >
              Continue to site
            </button>
          </div>
        ) : (
          <>
            <h2 id="mailing-list-heading" className="font-display text-2xl text-plum">
              Join the glow list
            </h2>
            <p className="mt-2 font-body text-sm text-plum/80">
              Be first to hear about specials, discounts and new treatments.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="popup-name" className="sr-only">
                  Name
                </label>
                <input
                  id="popup-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="popup-email" className="sr-only">
                  Email
                </label>
                <input
                  id="popup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
                />
              </div>

              {status === "error" && (
                <p className="font-body text-sm text-maroon" role="alert">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full bg-plum px-6 py-2.5 font-body font-semibold text-blush transition-colors hover:bg-glow disabled:opacity-60"
              >
                {status === "loading" ? "Signing up…" : "Sign me up"}
              </button>

              <button
                type="button"
                onClick={close}
                className="w-full font-body text-xs text-plum/60 underline-offset-2 hover:underline"
              >
                No thanks
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
