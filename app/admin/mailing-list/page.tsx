"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MailingListSubscriber } from "@/lib/types";
import { format } from "date-fns";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatBirthday(s: MailingListSubscriber): string {
  if (!s.birth_day || !s.birth_month) return "—";
  return `${s.birth_day} ${MONTH_NAMES[s.birth_month - 1]}`;
}

export default function AdminMailingListPage() {
  const [subscribers, setSubscribers] = useState<MailingListSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  function refresh() {
    supabase
      .from("mailing_list_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false })
      .then(({ data }) => {
        setSubscribers(data ?? []);
        setLoading(false);
      });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function deleteSubscriber(s: MailingListSubscriber) {
    if (!confirm(`Remove ${s.name} (${s.email}) from the mailing list? This cannot be undone.`)) return;
    setDeletingId(s.id);
    const { error } = await supabase.from("mailing_list_subscribers").delete().eq("id", s.id);
    setDeletingId(null);
    if (error) {
      alert("Could not remove this subscriber. Please try again.");
      return;
    }
    refresh();
  }

  function downloadCsv() {
    const header = "Name,Email,Birthday,Subscribed At\n";
    const rows = subscribers
      .map((s) => `"${s.name}","${s.email}","${formatBirthday(s)}","${s.subscribed_at}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hair-by-tanya-mailing-list.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="text-plum/70">Loading…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-plum">Mailing List</h1>
          <p className="mt-2 text-plum/70">{subscribers.length} subscriber(s).</p>
        </div>
        <button
          onClick={downloadCsv}
          disabled={subscribers.length === 0}
          className="rounded-full border border-plum px-5 py-2 text-plum transition-colors hover:bg-plum hover:text-blush disabled:opacity-50"
        >
          Download CSV
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl bg-white/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-rose/40 text-plum">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Birthday</th>
              <th className="px-4 py-3">Subscribed</th>
              <th className="px-4 py-3">Welcome email</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-t border-rose/40">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">{formatBirthday(s)}</td>
                <td className="px-4 py-3">{format(new Date(s.subscribed_at), "d MMM yyyy")}</td>
                <td className="px-4 py-3">{s.welcome_email_sent ? "Sent ✓" : "—"}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => deleteSubscriber(s)}
                    disabled={deletingId === s.id}
                    className="rounded-full border border-maroon/30 px-3 py-1 text-xs text-maroon transition-colors hover:bg-maroon hover:text-blush disabled:opacity-60"
                  >
                    {deletingId === s.id ? "Removing…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-plum/60">
                  No subscribers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
