"use client";

import { useState } from "react";

const AMOUNT_OPTIONS = [25, 50, 75, 100, 125, 150, 175, 200];

export default function GiftVoucherForm() {
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const effectiveAmount = customAmount ? parseInt(customAmount, 10) || 0 : amount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/gift-vouchers/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          buyerName,
          buyerEmail,
          recipientName: isGift ? recipientName : undefined,
          recipientEmail: isGift ? recipientEmail : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      // Send the browser to SumUp's hosted payment page.
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6 rounded-2xl bg-white/70 p-6 md:p-8">
      <div>
        <label className="mb-2 block font-body text-sm text-plum">Choose an amount</label>
        <div className="flex flex-wrap gap-2">
          {AMOUNT_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setAmount(opt);
                setCustomAmount("");
              }}
              className={`rounded-full border px-4 py-2 font-body text-sm transition-colors ${
                !customAmount && amount === opt
                  ? "border-glow bg-glow text-white"
                  : "border-rose bg-white text-plum hover:border-glow hover:text-glow"
              }`}
            >
              €{opt}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label htmlFor="custom-amount" className="mb-1 block font-body text-xs text-plum/70">
            Or enter any custom amount
          </label>
          <input
            id="custom-amount"
            type="number"
            step={1}
            min={1}
            placeholder="e.g. 60"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          required
          placeholder="Your name"
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
          className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
        />
        <input
          type="email"
          required
          placeholder="Your email"
          value={buyerEmail}
          onChange={(e) => setBuyerEmail(e.target.value)}
          className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-2 font-body text-sm text-plum">
        <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} />
        This is a gift for someone else
      </label>

      {isGift && (
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Recipient's name (optional)"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
          />
          <input
            type="email"
            placeholder="Recipient's email (optional)"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
          />
        </div>
      )}

      {status === "error" && (
        <p className="font-body text-sm text-maroon" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || effectiveAmount <= 0}
        className="w-full rounded-full bg-plum px-6 py-3 font-display text-blush transition-colors hover:bg-glow disabled:opacity-60"
      >
        {status === "loading" ? "Redirecting to payment…" : `Buy Voucher — €${effectiveAmount || 0}`}
      </button>
    </form>
  );
}
