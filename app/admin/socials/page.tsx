"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SocialLink } from "@/lib/types";
import { ICON_OPTIONS } from "@/components/SocialIcon";
import SocialIcon from "@/components/SocialIcon";

export default function AdminSocialsPage() {
  const supabase = createClient();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const { data } = await supabase.from("social_links").select("*").order("sort_order");
    setLinks(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addLink() {
    await supabase.from("social_links").insert({
      platform: "Instagram",
      url: "https://instagram.com/",
      icon_key: "instagram",
      sort_order: links.length,
    });
    refresh();
  }

  async function updateLink(link: SocialLink, patch: Partial<SocialLink>) {
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, ...patch } : l)));
    await supabase.from("social_links").update(patch).eq("id", link.id);
  }

  async function deleteLink(id: string) {
    if (!confirm("Remove this social link?")) return;
    await supabase.from("social_links").delete().eq("id", id);
    refresh();
  }

  if (loading) return <p className="text-plum/70">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl text-plum">Social Links</h1>
      <p className="mt-2 text-plum/70">
        These show as icon buttons in the footer of every page. Add, remove, or reorder as needed.
      </p>

      <button
        onClick={addLink}
        className="mt-6 rounded-full bg-plum px-6 py-2 text-blush transition-colors hover:bg-glow"
      >
        + Add social link
      </button>

      <div className="mt-6 space-y-3">
        {links.map((link) => (
          <div
            key={link.id}
            className="grid grid-cols-1 items-center gap-3 rounded-2xl bg-white/70 p-4 sm:grid-cols-[auto_1fr_2fr_auto_auto]"
          >
            <SocialIcon iconKey={link.icon_key} className="h-6 w-6 text-plum" />

            <select
              value={link.icon_key}
              onChange={(e) => updateLink(link, { icon_key: e.target.value })}
              className="rounded-full border border-rose bg-white px-3 py-1.5 text-sm text-plum"
            >
              {ICON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={link.platform}
              onChange={(e) => updateLink(link, { platform: e.target.value })}
              placeholder="Label (e.g. Instagram)"
              className="rounded-full border border-rose bg-white px-3 py-1.5 text-sm text-plum"
            />

            <input
              type="url"
              value={link.url}
              onChange={(e) => updateLink(link, { url: e.target.value })}
              placeholder="https://…"
              className="rounded-full border border-rose bg-white px-3 py-1.5 text-sm text-plum sm:col-span-1"
            />

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-plum">
                <input
                  type="checkbox"
                  checked={link.is_active}
                  onChange={(e) => updateLink(link, { is_active: e.target.checked })}
                />
                Show
              </label>
              <button onClick={() => deleteLink(link.id)} className="text-xs text-maroon hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
