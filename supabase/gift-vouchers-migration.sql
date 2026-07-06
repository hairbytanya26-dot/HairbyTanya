-- ============================================================
-- Hair by Tanya — Gift vouchers (SumUp payment)
-- Run this once in Supabase SQL Editor.
-- ============================================================

-- Site-wide on/off switch for the gift voucher feature.
alter table site_settings add column if not exists gift_vouchers_enabled boolean not null default true;

-- Issued vouchers (only created once a SumUp payment is confirmed).
create table if not exists gift_vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  amount numeric(10,2) not null,
  balance numeric(10,2) not null,
  buyer_name text not null,
  buyer_email text not null,
  recipient_name text,
  recipient_email text,
  sumup_checkout_id text,
  purchased_at timestamptz not null default now()
);

-- Tracks a purchase attempt from the moment "Buy" is clicked until SumUp
-- confirms payment — needed because the browser redirects away to SumUp's
-- hosted page and back, so we need somewhere to remember what was being
-- bought when the customer returns.
create table if not exists voucher_pending_orders (
  id uuid primary key default gen_random_uuid(),
  amount numeric(10,2) not null,
  buyer_name text not null,
  buyer_email text not null,
  recipient_name text,
  recipient_email text,
  sumup_checkout_id text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Support for redeeming a voucher against a booking (the "automatic"
-- online redemption path).
alter table bookings add column if not exists voucher_code_used text;
alter table bookings add column if not exists voucher_amount_applied numeric(10,2);
alter table bookings add column if not exists total_price numeric(10,2);

alter table gift_vouchers enable row level security;
alter table voucher_pending_orders enable row level security;

create policy "admin manage gift_vouchers" on gift_vouchers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin manage voucher_pending_orders" on voucher_pending_orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Note: all public-facing writes to these two tables happen through
-- server-side API routes using the service-role key (bypassing RLS
-- safely), the same pattern already used for bookings — never directly
-- from the browser with the anon key.
