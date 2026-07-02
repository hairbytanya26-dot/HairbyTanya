-- ============================================================
-- Hair by Tanya — Gallery feature migration
-- Run this ONCE in your Supabase project's SQL Editor, in addition
-- to (after) the original schema.sql. Safe to run only once — if
-- you run it twice, the "create policy" lines will error since
-- Postgres has no "create policy if not exists". If that happens,
-- it's harmless — everything before the error already succeeded.
-- ============================================================

-- ---------- GALLERY TABLE ----------
create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text not null,
  caption text default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table gallery_images enable row level security;

create policy "public read active gallery_images" on gallery_images
  for select using (is_active = true);

create policy "admin manage gallery_images" on gallery_images
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------- STORAGE BUCKET ----------
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- Anyone can view/download images (needed for the public gallery on the homepage)
create policy "public read gallery bucket" on storage.objects
  for select using (bucket_id = 'gallery');

-- Only signed-in admins can upload
create policy "admin upload gallery bucket" on storage.objects
  for insert with check (bucket_id = 'gallery' and auth.role() = 'authenticated');

-- Only signed-in admins can delete
create policy "admin delete gallery bucket" on storage.objects
  for delete using (bucket_id = 'gallery' and auth.role() = 'authenticated');
