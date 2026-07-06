"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SiteSettings } from "@/lib/types";

const FIELDS: { key: keyof Omit<SiteSettings, "id" | "gift_vouchers_enabled">; label: string; textarea?: boolean }[] = [
  { key: "business_name", label: "Business name" },
  { key: "hero_kicker", label: "Hero kicker (small text above title, e.g. 'xoxo')" },
  { key: "hero_title", label: "Hero title" },
  { key: "hero_subtitle", label: "Hero subtitle" },
  { key: "hero_tagline", label: "Hero tagline (italic line)" },
  { key: "about_eyebrow", label: "About section eyebrow label" },
  { key: "about_title", label: "About section title" },
  { key: "about_body", label: "About section body", textarea: true },
  { key: "booking_notice", label: "Booking page notice", textarea: true },
  { key: "contact_email", label: "Contact email" },
  { key: "contact_phone", label: "Contact phone" },
  { key: "address", label: "Address" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("loading");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        setSettings(data);
        setStatus("idle");
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.from("site_settings").update(settings).eq("id", 1);
    setStatus(error ? "error" : "saved");
    if (!error) setTimeout(() => setStatus("idle"), 2000);
  }

  if (status === "loading" || !settings) {
    return <p className="text-plum/70">Loading…</p>;
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-plum">Site Text</h1>
      <p className="mt-2 text-plum/70">
        This controls the wording on your homepage and booking page.
      </p>

      <form onSubmit={handleSave} className="mt-8 max-w-2xl space-y-5">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="mb-1 block text-sm text-plum">{field.label}</label>
            {field.textarea ? (
              <textarea
                rows={4}
                value={settings[field.key] ?? ""}
                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                className="w-full rounded-2xl border border-rose bg-white px-4 py-2 text-plum focus:border-glow focus:outline-none"
              />
            ) : (
              <input
                type="text"
                value={settings[field.key] ?? ""}
                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                className="w-full rounded-full border border-rose bg-white px-4 py-2 text-plum focus:border-glow focus:outline-none"
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-full bg-plum px-8 py-2.5 font-display text-blush transition-colors hover:bg-glow disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save changes"}
        </button>
        {status === "error" && <p className="text-sm text-maroon">Could not save. Please try again.</p>}
      </form>
    </div>
  );
}
