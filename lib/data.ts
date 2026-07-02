import { createClient } from "@/lib/supabase/server";
import type {
  SiteSettings,
  SocialLink,
  PriceCategory,
  PriceItem,
  Review,
  GalleryImage,
} from "@/lib/types";

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  return data;
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("social_links")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getPriceList(): Promise<{
  categories: PriceCategory[];
  itemsByCategory: Record<string, PriceItem[]>;
}> {
  const supabase = createClient();
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("price_categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("price_items").select("*").eq("is_active", true).order("sort_order"),
  ]);

  const itemsByCategory: Record<string, PriceItem[]> = {};
  (items ?? []).forEach((item) => {
    if (!itemsByCategory[item.category_id]) itemsByCategory[item.category_id] = [];
    itemsByCategory[item.category_id].push(item);
  });

  return { categories: categories ?? [], itemsByCategory };
}

export async function getReviews(): Promise<Review[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("is_featured", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}
