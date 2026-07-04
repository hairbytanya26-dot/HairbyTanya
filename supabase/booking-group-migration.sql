-- ============================================================
-- Hair by Tanya — Admin-configurable gap-booking groups
-- Run this once in Supabase SQL Editor.
--
-- This replaces the hardcoded "Colour Bar/Blonde Bar/etc." category list
-- in the code with a per-item setting you control yourself in
-- /admin/pricelist — so any future "needs a 30-min gap" service (like
-- 16 Week Blow Dry) can be set up without needing a code change.
-- ============================================================

alter table price_items add column if not exists booking_group text;
alter table price_items drop constraint if exists price_items_booking_group_check;
alter table price_items add constraint price_items_booking_group_check
  check (booking_group in ('first', 'second') or booking_group is null);

-- Backfill using the same rules that were previously hardcoded in the
-- booking API, so existing behaviour doesn't change.
update price_items pi
set booking_group = 'first'
from price_categories pc
where pi.category_id = pc.id
  and pc.name in ('Colour Bar', 'Blonde Bar', 'Balayage', 'Face Frame')
  and pi.booking_group is null;

update price_items pi
set booking_group = 'second'
from price_categories pc
where pi.category_id = pc.id
  and pc.name in ('Style Bar', 'Cuts', 'After Colour Services')
  and pi.booking_group is null;

-- Your new 16 Week Blow Dry items:
update price_items set booking_group = 'first'
  where name = '16 Week Blow Dry' and booking_group is null;
update price_items set booking_group = 'second'
  where name in ('16 Week Blow Dry - Cut Finish', '16 Week Blow Dry - Blow Dry Finish')
  and booking_group is null;
