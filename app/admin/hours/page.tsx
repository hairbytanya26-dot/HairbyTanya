"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface WorkingHoursRow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminHoursPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<WorkingHoursRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    supabase
      .from("working_hours")
      .select("*")
      .order("day_of_week")
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateRow(id: string, patch: Partial<WorkingHoursRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function saveAll() {
    setSaving(true);
    setSavedMsg("");
    for (const row of rows) {
      await supabase
        .from("working_hours")
        .update({
          start_time: row.start_time,
          end_time: row.end_time,
          is_active: row.is_active,
        })
        .eq("id", row.id);
    }
    // Top up the rolling window immediately so a schedule change reflects
    // right away, rather than waiting for the next visit to trigger it.
    await fetch("/api/admin/ensure-slots", { method: "POST" });
    setSaving(false);
    setSavedMsg("Saved — new availability will appear on the booking page shortly.");
  }

  if (loading) return <p className="text-plum/70">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl text-plum">Working Hours</h1>
      <p className="mt-2 text-plum/70">
        Set which days you work and your hours. The site automatically keeps 6 weeks of booking slots
        open based on this schedule — no need to add slots manually day by day anymore.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl bg-white/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-rose/40 text-plum">
            <tr>
              <th className="px-4 py-3">Day</th>
              <th className="px-4 py-3">Working?</th>
              <th className="px-4 py-3">Start time</th>
              <th className="px-4 py-3">End time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-rose/40">
                <td className="px-4 py-3 font-display text-mauve">{DAY_NAMES[row.day_of_week]}</td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={row.is_active}
                    onChange={(e) => updateRow(row.id, { is_active: e.target.checked })}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={row.start_time}
                    onChange={(e) => updateRow(row.id, { start_time: e.target.value })}
                    disabled={!row.is_active}
                    className="rounded-full border border-rose bg-white px-3 py-1.5 text-plum disabled:opacity-40"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={row.end_time}
                    onChange={(e) => updateRow(row.id, { end_time: e.target.value })}
                    disabled={!row.is_active}
                    className="rounded-full border border-rose bg-white px-3 py-1.5 text-plum disabled:opacity-40"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={saveAll}
        disabled={saving}
        className="mt-6 rounded-full bg-plum px-8 py-2.5 font-display text-blush transition-colors hover:bg-glow disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save working hours"}
      </button>
      {savedMsg && <p className="mt-3 text-sm text-plum/70">{savedMsg}</p>}

      <p className="mt-8 text-xs text-plum/50">
        Note: slots are generated in 15-minute increments to match your treatment durations
        (30/45/60/75/90 mins all divide evenly into 15). Changing hours here only affects newly
        generated slots — it won&apos;t retroactively change slots that already exist and are visible
        to customers.
      </p>
    </div>
  );
}
