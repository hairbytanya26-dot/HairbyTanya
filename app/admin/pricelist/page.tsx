"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PriceCategory, PriceItem } from "@/lib/types";

export default function AdminPriceListPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<PriceCategory[]>([]);
  const [items, setItems] = useState<PriceItem[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [{ data: cats }, { data: its }] = await Promise.all([
      supabase.from("price_categories").select("*").order("sort_order"),
      supabase.from("price_items").select("*").order("sort_order"),
    ]);
    setCategories(cats ?? []);
    setItems(its ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    await supabase
      .from("price_categories")
      .insert({ name: newCategoryName.trim(), sort_order: categories.length });
    setNewCategoryName("");
    refresh();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category and all its treatments?")) return;
    await supabase.from("price_categories").delete().eq("id", id);
    refresh();
  }

  async function toggleCategoryActive(cat: PriceCategory) {
    await supabase.from("price_categories").update({ is_active: !cat.is_active }).eq("id", cat.id);
    refresh();
  }

  async function addItem(categoryId: string) {
    await supabase.from("price_items").insert({
      category_id: categoryId,
      name: "New treatment",
      price: 0,
      sort_order: items.filter((i) => i.category_id === categoryId).length,
    });
    refresh();
  }

  async function updateItem(item: PriceItem, patch: Partial<PriceItem>) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch } : i)));
    await supabase.from("price_items").update(patch).eq("id", item.id);
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this treatment?")) return;
    await supabase.from("price_items").delete().eq("id", id);
    refresh();
  }

  if (loading) return <p className="text-plum/70">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl text-plum">Price List</h1>
      <p className="mt-2 text-plum/70">
        Changes appear on the public price list page within about a minute.
      </p>

      <div className="mt-8 flex gap-3">
        <input
          type="text"
          placeholder="New category name (e.g. Lip Fillers)"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="flex-1 rounded-full border border-rose bg-white px-4 py-2 text-plum focus:border-glow focus:outline-none"
        />
        <button
          onClick={addCategory}
          className="rounded-full bg-plum px-6 py-2 text-blush transition-colors hover:bg-glow"
        >
          Add category
        </button>
      </div>

      <div className="mt-10 space-y-10">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-2xl bg-white/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input
                type="text"
                value={cat.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, name: value } : c)));
                }}
                onBlur={async (e) => {
                  await supabase.from("price_categories").update({ name: e.target.value }).eq("id", cat.id);
                }}
                className="rounded-full border border-transparent bg-transparent px-2 py-1 font-display text-xl text-mauve hover:border-rose focus:border-glow focus:outline-none"
              />
              <div className="flex items-center gap-2 text-sm">
                <label className="flex items-center gap-1 text-plum">
                  <input type="checkbox" checked={cat.is_active} onChange={() => toggleCategoryActive(cat)} />
                  Visible on site
                </label>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="rounded-full border border-maroon px-3 py-1 text-maroon transition-colors hover:bg-maroon hover:text-white"
                >
                  Delete category
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {items
                .filter((i) => i.category_id === cat.id)
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-blush px-4 py-3"
                  >
                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[2fr_2fr_1fr_1fr_auto]">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item, { name: e.target.value })}
                      placeholder="Treatment name"
                      className="rounded-full border border-rose bg-white px-3 py-1.5 text-sm text-plum focus:border-glow focus:outline-none"
                    />
                    <input
                      type="text"
                      value={item.description ?? ""}
                      onChange={(e) => updateItem(item, { description: e.target.value })}
                      placeholder="Description (optional)"
                      className="rounded-full border border-rose bg-white px-3 py-1.5 text-sm text-plum focus:border-glow focus:outline-none"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(item, { price: parseFloat(e.target.value) || 0 })}
                      placeholder="Price"
                      className="rounded-full border border-rose bg-white px-3 py-1.5 text-sm text-plum focus:border-glow focus:outline-none"
                    />
                    <input
                      type="number"
                      value={item.duration_minutes ?? ""}
                      onChange={(e) =>
                        updateItem(item, { duration_minutes: e.target.value ? parseInt(e.target.value) : null })
                      }
                      placeholder="Mins"
                      className="rounded-full border border-rose bg-white px-3 py-1.5 text-sm text-plum focus:border-glow focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-plum">
                        <input
                          type="checkbox"
                          checked={item.is_active}
                          onChange={(e) => updateItem(item, { is_active: e.target.checked })}
                        />
                        Live
                      </label>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-xs text-maroon hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs text-plum/70">Booking timing:</label>
                      <select
                        value={item.booking_group ?? ""}
                        onChange={(e) =>
                          updateItem(item, {
                            booking_group: e.target.value ? (e.target.value as "first" | "second") : null,
                          })
                        }
                        className="rounded-full border border-rose bg-white px-3 py-1 text-xs text-plum focus:border-glow focus:outline-none"
                      >
                        <option value="">Normal (no gap needed)</option>
                        <option value="first">Goes first — needs a 30-min gap before any &quot;after gap&quot; service</option>
                        <option value="second">Goes after the 30-min gap (e.g. a finishing/cut service)</option>
                      </select>
                    </div>
                  </div>
                ))}

              <button
                onClick={() => addItem(cat.id)}
                className="mt-2 rounded-full border border-plum px-4 py-1.5 text-sm text-plum transition-colors hover:bg-plum hover:text-blush"
              >
                + Add treatment
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
