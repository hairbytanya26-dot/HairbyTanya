"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GiftVoucher, GiftVoucherPreset } from "@/lib/types";
import { format } from "date-fns";

interface PendingVoucherOrder {
  id: string;
  amount: number;
  buyer_name: string;
  buyer_email: string;
  recipient_name: string | null;
  recipient_email: string | null;
  payment_method: string;
  completed: boolean;
  created_at: string;
}

export default function AdminVouchersPage() {
  const supabase = createClient();
  const [vouchers, setVouchers] = useState<GiftVoucher[]>([]);
  const [presets, setPresets] = useState<GiftVoucherPreset[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingVoucherOrder[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);
  const [redeemAmounts, setRedeemAmounts] = useState<Record<string, string>>({});
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [presetEdits, setPresetEdits] = useState<Record<string, string>>({});
  const [newPresetAmount, setNewPresetAmount] = useState("");
  const [savingPreset, setSavingPreset] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [newAmount, setNewAmount] = useState("");
  const [newBuyerName, setNewBuyerName] = useState("");
  const [newBuyerEmail, setNewBuyerEmail] = useState("");
  const [newRecipientName, setNewRecipientName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccessMsg, setCreateSuccessMsg] = useState("");

  const [bdayAmount, setBdayAmount] = useState("");
  const [bdayName, setBdayName] = useState("");
  const [bdayEmail, setBdayEmail] = useState("");
  const [bdayCreating, setBdayCreating] = useState(false);
  const [bdayError, setBdayError] = useState("");
  const [bdaySuccessMsg, setBdaySuccessMsg] = useState("");

  async function refresh() {
    const [{ data: voucherData }, { data: settingsData }, { data: presetData }, { data: pendingData }] =
      await Promise.all([
        supabase.from("gift_vouchers").select("*").order("purchased_at", { ascending: false }),
        supabase.from("site_settings").select("gift_vouchers_enabled").eq("id", 1).single(),
        supabase.from("gift_voucher_presets").select("*").order("sort_order"),
        supabase
          .from("voucher_pending_orders")
          .select("*")
          .eq("completed", false)
          .order("created_at", { ascending: true }),
      ]);
    setVouchers(voucherData ?? []);
    setEnabled(settingsData?.gift_vouchers_enabled ?? true);
    setPresets(presetData ?? []);
    setPresetEdits(Object.fromEntries((presetData ?? []).map((p) => [p.id, String(p.amount)])));
    setPendingRequests(pendingData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleEnabled() {
    setSavingToggle(true);
    const newValue = !enabled;
    await supabase.from("site_settings").update({ gift_vouchers_enabled: newValue }).eq("id", 1);
    setEnabled(newValue);
    setSavingToggle(false);
  }

  async function redeemInPerson(voucher: GiftVoucher) {
    const amountStr = redeemAmounts[voucher.id];
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      alert("Enter a valid amount to redeem.");
      return;
    }
    if (amount > voucher.balance) {
      alert(`That's more than the remaining balance (€${voucher.balance.toFixed(2)}).`);
      return;
    }

    setRedeemingId(voucher.id);
    const newBalance = Math.round((voucher.balance - amount) * 100) / 100;
    await supabase.from("gift_vouchers").update({ balance: newBalance }).eq("id", voucher.id);
    setRedeemAmounts((prev) => ({ ...prev, [voucher.id]: "" }));
    setRedeemingId(null);
    refresh();
  }

  async function markFullyUsed(voucher: GiftVoucher) {
    if (!confirm(`Mark this voucher (€${voucher.balance.toFixed(2)} remaining) as fully used?`)) return;
    setRedeemingId(voucher.id);
    await supabase.from("gift_vouchers").update({ balance: 0 }).eq("id", voucher.id);
    setRedeemingId(null);
    refresh();
  }

  async function deleteVoucher(voucher: GiftVoucher) {
    const label = `${voucher.code} (€${voucher.amount.toFixed(2)})`;
    if (!confirm(`Delete voucher ${label}? This cannot be undone.`)) return;

    setDeletingId(voucher.id);
    const { error } = await supabase.from("gift_vouchers").delete().eq("id", voucher.id);
    setDeletingId(null);

    if (error) {
      alert("Could not delete this voucher. Please try again.");
      return;
    }

    refresh();
  }

  async function addPreset() {
    const amountNum = parseFloat(newPresetAmount);
    if (!amountNum || amountNum <= 0) {
      alert("Enter a valid amount.");
      return;
    }
    setSavingPreset("new");
    await supabase.from("gift_voucher_presets").insert({
      amount: amountNum,
      sort_order: presets.length,
    });
    setNewPresetAmount("");
    setSavingPreset(null);
    refresh();
  }

  async function savePresetEdit(preset: GiftVoucherPreset) {
    const amountNum = parseFloat(presetEdits[preset.id]);
    if (!amountNum || amountNum <= 0) {
      alert("Enter a valid amount.");
      return;
    }
    setSavingPreset(preset.id);
    await supabase.from("gift_voucher_presets").update({ amount: amountNum }).eq("id", preset.id);
    setSavingPreset(null);
    refresh();
  }

  async function deletePreset(preset: GiftVoucherPreset) {
    if (!confirm(`Remove the €${preset.amount} preset? Customers won't see this button anymore.`)) return;
    setSavingPreset(preset.id);
    await supabase.from("gift_voucher_presets").delete().eq("id", preset.id);
    setSavingPreset(null);
    refresh();
  }

  async function createVoucherManually(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreateSuccessMsg("");

    const amountNum = parseFloat(newAmount);
    if (!amountNum || amountNum <= 0) {
      setCreateError("Enter a valid amount.");
      return;
    }
    if (!newBuyerName.trim()) {
      setCreateError("Enter a name for this voucher.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/create-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          buyerName: newBuyerName,
          buyerEmail: newBuyerEmail || undefined,
          recipientName: newRecipientName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the voucher.");

      setCreateSuccessMsg(
        newBuyerEmail
          ? data.emailSent
            ? `Voucher ${data.voucher.code} created and emailed to ${newBuyerEmail}.`
            : `Voucher ${data.voucher.code} created, but the email failed to send — check the address or try resending manually.`
          : `Voucher ${data.voucher.code} created (no email address given, so nothing was sent).`
      );

      setNewAmount("");
      setNewBuyerName("");
      setNewBuyerEmail("");
      setNewRecipientName("");
      refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  async function approveRequest(order: PendingVoucherOrder) {
    if (!confirm(`Confirm you've received €${order.amount.toFixed(2)} from ${order.buyer_name} on Revolut, and issue the voucher now?`)) return;
    setApprovingId(order.id);
    try {
      const res = await fetch("/api/admin/approve-voucher-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not approve this request.");
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setApprovingId(null);
    }
  }

  async function declineRequest(order: PendingVoucherOrder) {
    if (!confirm(`Remove this request from the list? No voucher will be issued (use this if payment was never received).`)) return;
    setApprovingId(order.id);
    await supabase.from("voucher_pending_orders").delete().eq("id", order.id);
    setApprovingId(null);
    refresh();
  }

  async function createBirthdayVoucher(e: React.FormEvent) {
    e.preventDefault();
    setBdayError("");
    setBdaySuccessMsg("");

    const amountNum = parseFloat(bdayAmount);
    if (!amountNum || amountNum <= 0) {
      setBdayError("Enter a valid amount.");
      return;
    }
    if (!bdayName.trim()) {
      setBdayError("Enter the customer's name.");
      return;
    }
    if (!bdayEmail.trim()) {
      setBdayError("An email address is required so the birthday message can be sent.");
      return;
    }

    setBdayCreating(true);
    try {
      const res = await fetch("/api/admin/create-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          buyerName: bdayName,
          buyerEmail: bdayEmail,
          voucherType: "birthday",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the voucher.");

      setBdaySuccessMsg(
        data.emailSent
          ? `Birthday voucher ${data.voucher.code} created and emailed to ${bdayEmail}.`
          : `Voucher ${data.voucher.code} created, but the email failed to send — check the address or try again.`
      );

      setBdayAmount("");
      setBdayName("");
      setBdayEmail("");
      refresh();
    } catch (err) {
      setBdayError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBdayCreating(false);
    }
  }

  if (loading) return <p className="text-plum/70">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl text-plum">Gift Vouchers</h1>
      <p className="mt-2 text-plum/70">
        Set which amounts customers can pick from, add vouchers manually, and manage every voucher
        that&apos;s been issued — its remaining balance, and redemption when used in person.
      </p>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/70 p-6">
        <label className="flex items-center gap-3 font-body text-plum">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggleEnabled}
            disabled={savingToggle}
            className="h-5 w-5 accent-glow"
          />
          Gift vouchers available for purchase on the website
        </label>
      </div>

      <div className="mt-6 rounded-2xl bg-white/70 p-6">
        <h2 className="font-display text-xl text-mauve">
          Pending Revolut requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
        </h2>
        <p className="mt-1 text-sm text-plum/70">
          Customers land here after requesting a voucher online. Check your Revolut app for the
          payment, then approve to issue the voucher and send the email automatically.
        </p>
        {pendingRequests.length === 0 ? (
          <p className="mt-4 text-sm text-plum/50">No pending requests right now.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {pendingRequests.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blush px-4 py-3"
              >
                <div>
                  <p className="font-body text-sm text-plum">
                    <span className="font-semibold">€{order.amount.toFixed(2)}</span> — {order.buyer_name}{" "}
                    <span className="text-plum/60">({order.buyer_email})</span>
                  </p>
                  <p className="text-xs text-plum/50">
                    Requested {format(new Date(order.created_at), "d MMM yyyy, h:mmaaa")}
                    {order.recipient_name && ` · Gift for ${order.recipient_name}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveRequest(order)}
                    disabled={approvingId === order.id}
                    className="rounded-full bg-plum px-4 py-1.5 text-xs text-blush transition-colors hover:bg-glow disabled:opacity-60"
                  >
                    {approvingId === order.id ? "Working…" : "Approve & Send"}
                  </button>
                  <button
                    onClick={() => declineRequest(order)}
                    disabled={approvingId === order.id}
                    className="rounded-full border border-maroon/30 px-4 py-1.5 text-xs text-maroon transition-colors hover:bg-maroon hover:text-blush disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-white/70 p-6">
        <h2 className="font-display text-xl text-mauve">Preset amounts</h2>
        <p className="mt-1 text-sm text-plum/70">
          These are the quick-select buttons customers see on the Gift Vouchers page. Edit or remove any
          of them, or add new ones — customers can always type a different amount too (minimum €20).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {presets.map((preset) => (
            <div key={preset.id} className="flex items-center gap-1 rounded-full border border-rose bg-white px-2 py-1">
              <span className="pl-2 text-sm text-plum/60">€</span>
              <input
                type="number"
                step="0.01"
                value={presetEdits[preset.id] ?? ""}
                onChange={(e) => setPresetEdits((prev) => ({ ...prev, [preset.id]: e.target.value }))}
                className="w-16 text-sm text-plum focus:outline-none"
              />
              <button
                onClick={() => savePresetEdit(preset)}
                disabled={savingPreset === preset.id}
                className="rounded-full px-2 py-1 text-xs text-glow hover:underline disabled:opacity-60"
              >
                Save
              </button>
              <button
                onClick={() => deletePreset(preset)}
                disabled={savingPreset === preset.id}
                className="rounded-full px-2 py-1 text-xs text-maroon hover:underline disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          ))}
          <div className="flex items-center gap-1 rounded-full border border-dashed border-rose px-2 py-1">
            <span className="pl-2 text-sm text-plum/60">€</span>
            <input
              type="number"
              step="0.01"
              placeholder="New"
              value={newPresetAmount}
              onChange={(e) => setNewPresetAmount(e.target.value)}
              className="w-16 text-sm text-plum placeholder:text-plum/40 focus:outline-none"
            />
            <button
              onClick={addPreset}
              disabled={savingPreset === "new"}
              className="rounded-full px-2 py-1 text-xs text-glow hover:underline disabled:opacity-60"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white/70 p-6">
        <h2 className="font-display text-xl text-mauve">Add a voucher manually</h2>
        <p className="mt-1 text-sm text-plum/70">
          For cash sales, gestures of goodwill, or anything sold outside the website — any amount is
          fine, it doesn&apos;t need to be a round number.
        </p>
        <form onSubmit={createVoucherManually} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Amount (€)"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="rounded-full border border-rose bg-white px-4 py-2 text-sm text-plum focus:border-glow focus:outline-none"
          />
          <input
            type="text"
            placeholder="Name"
            value={newBuyerName}
            onChange={(e) => setNewBuyerName(e.target.value)}
            className="rounded-full border border-rose bg-white px-4 py-2 text-sm text-plum focus:border-glow focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={newBuyerEmail}
            onChange={(e) => setNewBuyerEmail(e.target.value)}
            className="rounded-full border border-rose bg-white px-4 py-2 text-sm text-plum focus:border-glow focus:outline-none"
          />
          <input
            type="text"
            placeholder="This is a gift for... (optional)"
            value={newRecipientName}
            onChange={(e) => setNewRecipientName(e.target.value)}
            className="rounded-full border border-rose bg-white px-4 py-2 text-sm text-plum focus:border-glow focus:outline-none"
          />
          {createError && (
            <p className="sm:col-span-2 text-sm text-maroon" role="alert">
              {createError}
            </p>
          )}
          {createSuccessMsg && (
            <p className="sm:col-span-2 text-sm text-glow">
              {createSuccessMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={creating}
            className="sm:col-span-2 rounded-full bg-plum px-6 py-2.5 font-display text-blush transition-colors hover:bg-glow disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create voucher"}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-2xl bg-white/70 p-6">
        <h2 className="font-display text-xl text-mauve">Send a birthday voucher 🎂</h2>
        <p className="mt-1 text-sm text-plum/70">
          Creates a voucher and emails it with a birthday message instead of the usual purchase
          confirmation. An email address is required here, since sending it is the whole point.
        </p>
        <form onSubmit={createBirthdayVoucher} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Amount (€)"
            value={bdayAmount}
            onChange={(e) => setBdayAmount(e.target.value)}
            className="rounded-full border border-rose bg-white px-4 py-2 text-sm text-plum focus:border-glow focus:outline-none"
          />
          <input
            type="text"
            placeholder="Customer's name"
            value={bdayName}
            onChange={(e) => setBdayName(e.target.value)}
            className="rounded-full border border-rose bg-white px-4 py-2 text-sm text-plum focus:border-glow focus:outline-none"
          />
          <input
            type="email"
            placeholder="Customer's email"
            value={bdayEmail}
            onChange={(e) => setBdayEmail(e.target.value)}
            className="rounded-full border border-rose bg-white px-4 py-2 text-sm text-plum focus:border-glow focus:outline-none"
          />
          {bdayError && (
            <p className="sm:col-span-3 text-sm text-maroon" role="alert">
              {bdayError}
            </p>
          )}
          {bdaySuccessMsg && <p className="sm:col-span-3 text-sm text-glow">{bdaySuccessMsg}</p>}
          <button
            type="submit"
            disabled={bdayCreating}
            className="sm:col-span-3 rounded-full bg-plum px-6 py-2.5 font-display text-blush transition-colors hover:bg-glow disabled:opacity-60"
          >
            {bdayCreating ? "Sending…" : "Send Birthday Voucher"}
          </button>
        </form>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl bg-white/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-rose/40 text-plum">
            <tr>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Purchased</th>
              <th className="px-4 py-3">Redeem in person</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id} className="border-t border-rose/40">
                <td className="px-4 py-3">
                  {v.buyer_name}
                  <div className="text-xs text-plum/60">{v.buyer_email}</div>
                </td>
                <td className="px-4 py-3 text-xs capitalize text-plum/70">
                  {v.voucher_type === "birthday" ? "🎂 Birthday" : v.voucher_type}
                </td>
                <td className="px-4 py-3">
                  {v.recipient_name || "—"}
                  {v.recipient_email && <div className="text-xs text-plum/60">{v.recipient_email}</div>}
                </td>
                <td className="px-4 py-3">€{v.amount.toFixed(2)}</td>
                <td className="px-4 py-3 font-semibold">
                  €{v.balance.toFixed(2)}
                  {v.balance <= 0 && <span className="ml-1 text-xs text-plum/50">(expired)</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{v.code}</td>
                <td className="px-4 py-3">{format(new Date(v.purchased_at), "d MMM yyyy")}</td>
                <td className="px-4 py-3">
                  {v.balance > 0 ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="€ amount"
                          value={redeemAmounts[v.id] ?? ""}
                          onChange={(e) => setRedeemAmounts((prev) => ({ ...prev, [v.id]: e.target.value }))}
                          className="w-24 rounded-full border border-rose bg-white px-3 py-1 text-xs text-plum"
                        />
                        <button
                          onClick={() => redeemInPerson(v)}
                          disabled={redeemingId === v.id || deletingId === v.id}
                          className="rounded-full bg-plum px-3 py-1 text-xs text-blush transition-colors hover:bg-glow disabled:opacity-60"
                        >
                          Redeem amount
                        </button>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-plum">
                        <input
                          type="checkbox"
                          checked={false}
                          disabled={redeemingId === v.id || deletingId === v.id}
                          onChange={() => markFullyUsed(v)}
                          className="h-4 w-4 accent-glow"
                        />
                        Tick to mark fully used
                      </label>
                    </div>
                  ) : (
                    <span className="text-xs text-plum/50">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => deleteVoucher(v)}
                    disabled={deletingId === v.id || redeemingId === v.id}
                    className="rounded-full border border-maroon/30 px-3 py-1 text-xs text-maroon transition-colors hover:bg-maroon hover:text-blush disabled:opacity-60"
                  >
                    {deletingId === v.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-plum/60">
                  No vouchers purchased yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
