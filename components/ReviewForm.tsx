"use client";

import { useState } from "react";

export default function ReviewForm() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author_name: name, rating, body }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      setName("");
      setRating(5);
      setBody("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-white/70 p-6 text-center">
        <h3 className="font-display text-xl text-plum">Thanks for your review! ✨</h3>
        <p className="mt-2 font-body text-sm text-plum/70">It&apos;s now live on this page.</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 rounded-full border border-plum px-5 py-1.5 text-sm text-plum transition-colors hover:bg-plum hover:text-blush"
        >
          Leave another review
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white/70 p-6">
      <h3 className="font-display text-xl text-plum">Leave a review</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          required
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-full border border-rose bg-white px-4 py-2 font-body text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <label className="font-body text-sm text-plum">Rating</label>
          <div role="radiogroup" aria-label="Rating" className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                onClick={() => setRating(n)}
                className={`text-2xl leading-none transition-colors ${
                  n <= rating ? "text-glow" : "text-rose/60"
                }`}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>

      <textarea
        required
        placeholder="Tell us about your visit…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={1000}
        className="mt-4 w-full rounded-2xl border border-rose bg-white px-4 py-2 font-body text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
      />

      {status === "error" && (
        <p className="mt-2 font-body text-sm text-maroon" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-4 rounded-full bg-plum px-6 py-2.5 font-display text-blush transition-colors hover:bg-glow disabled:opacity-60"
      >
        {status === "loading" ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
