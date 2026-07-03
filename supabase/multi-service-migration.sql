-- ============================================================
-- Hair by Tanya — Multiple services per booking
-- Run this once in Supabase SQL Editor.
-- ============================================================

create table if not exists booking_services (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  service_id uuid references price_items(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table booking_services enable row level security;

-- Only admins read/manage this directly — the booking API route writes to it
-- using the service-role key, which bypasses RLS entirely.
create policy "admin manage booking_services" on booking_services
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- The old single service_id column on bookings stays in place for any
-- existing bookings made before this change, but new bookings will use
-- booking_services instead and leave that column blank.
