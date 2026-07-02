"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Review } from "@/lib/types";

export default function AdminReviewsPage() {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const { data } = await supabase.from("reviews").select("*").order("sort_order");
    setReviews(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addReview() {
    await supabase.from("reviews").insert({
      author_name: "Client name",
      rating: 5,
      body: "Write the review here…",
      sort_order: reviews.length,
    });
    refresh();
  }

  async function updateReview(review: Review, patch: Partial<Review>) {
    setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, ...patch } : r)));
    await supabase.from("reviews").update(patch).eq("id", review.id);
  }

  async function deleteReview(id: string) {
    if (!confirm("Delete this review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    refresh();
  }

  if (loading) return <p className="text-plum/70">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl text-plum">Reviews</h1>
      <p className="mt-2 text-plum/70">Manage what appears on the public reviews page.</p>

      <button
        onClick={addReview}
        className="mt-6 rounded-full bg-plum px-6 py-2 text-blush transition-colors hover:bg-glow"
      >
        + Add review
      </button>

      <div className="mt-6 space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl bg-white/70 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={review.author_name}
                onChange={(e) => updateReview(review, { author_name: e.target.value })}
                className="rounded-full border border-rose bg-white px-3 py-1.5 text-sm text-plum"
              />
              <select
                value={review.rating}
                onChange={(e) => updateReview(review, { rating: parseInt(e.target.value) })}
                className="rounded-full border border-rose bg-white px-3 py-1.5 text-sm text-plum"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs text-plum">
                <input
                  type="checkbox"
                  checked={review.is_featured}
                  onChange={(e) => updateReview(review, { is_featured: e.target.checked })}
                />
                Show on site
              </label>
              <button
                onClick={() => deleteReview(review.id)}
                className="ml-auto text-xs text-maroon hover:underline"
              >
                Delete
              </button>
            </div>
            <textarea
              value={review.body}
              onChange={(e) => updateReview(review, { body: e.target.value })}
              rows={3}
              className="mt-3 w-full rounded-2xl border border-rose bg-white px-4 py-2 text-sm text-plum"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
