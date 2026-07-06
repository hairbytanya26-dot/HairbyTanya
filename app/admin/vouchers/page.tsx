"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GiftVoucher } from "@/lib/types";
import { format } from "date-fns";

export default function AdminVouchersPage() {
  const supabase = createClient();
  const [vouchers, setVouchers] = useState<GiftVoucher[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);
  const [redeemAmounts, setRedeemAmounts] = useState<Record<string, string>>({});
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  async function refresh() {
    const [{ data: voucherData }, { data: settingsData }] = await Promise.all([
      supabase.from("gift_vouchers").select("*").order("purchased_at", { ascending: false }),
      supabase.from("site_settings").select("gift_vouchers_enabled").eq("id", 1).single(),
    ]);
    setVouchers(voucherData ?? []);
    setEnabled(settingsData?.gift_vouchers_enabled ?? true);
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

  if (loading) return <p className="text-plum/70">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl text-plum">Gift Vouchers</h1>
      <p className="mt-2 text-plum/70">
        Every voucher purchased online is logged here, with its remaining balance. Use the redeem box
        when a customer uses a voucher in person.
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

      <div className="mt-8 overflow-x-auto rounded-2xl bg-white/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-rose/40 text-plum">
            <tr>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Purchased</th>
              <th className="px-4 py-3">Redeem in person</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id} className="border-t border-rose/40">
                <td className="px-4 py-3">
                  {v.buyer_name}
                  <div className="text-xs text-plum/60">{v.buyer_email}</div>
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
                          disabled={redeemingId === v.id}
                          className="rounded-full bg-plum px-3 py-1 text-xs text-blush transition-colors hover:bg-glow disabled:opacity-60"
                        >
                          Redeem amount
                        </button>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-plum">
                        <input
                          type="checkbox"
                          checked={false}
                          disabled={redeemingId === v.id}
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
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-plum/60">
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
