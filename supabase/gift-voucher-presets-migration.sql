-- ============================================================
-- Hair by Tanya — Admin-configurable gift voucher presets
-- Run this once in Supabase SQL Editor.
-- ============================================================

create table if not exists gift_voucher_presets (
  id uuid primary key default gen_random_uuid(),
  amount numeric(10,2) not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

alter table gift_voucher_presets enable row level security;

create policy "public read active gift_voucher_presets" on gift_voucher_presets
  for select using (is_active = true);

create policy "admin manage gift_voucher_presets" on gift_voucher_presets
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Starter presets — fully editable/removable from /admin/vouchers afterward.
insert into gift_voucher_presets (amount, sort_order)
select * from (values (25, 0), (50, 1), (75, 2), (100, 3)) as t(amount, sort_order)
where not exists (select 1 from gift_voucher_presets);
