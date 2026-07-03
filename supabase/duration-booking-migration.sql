-- ============================================================
-- Hair by Tanya — Duration-aware bookings
-- Run this once in Supabase SQL Editor.
-- ============================================================

-- Store the REAL start/end time and total duration on each booking,
-- since a booking may now span multiple pre-generated slots depending
-- on how many/which services were selected.
alter table bookings add column if not exists start_time timestamptz;
alter table bookings add column if not exists end_time timestamptz;
alter table bookings add column if not exists total_duration_minutes int not null default 30;

-- Backfill any existing bookings (made before this change) using their
-- linked slot's own start/end, so old rows aren't left with blank times.
update bookings b
set start_time = s.start_time,
    end_time = s.end_time,
    total_duration_minutes = extract(epoch from (s.end_time - s.start_time)) / 60
from availability_slots s
where b.slot_id = s.id and b.start_time is null;

-- ============================================================
-- Estimated durations for your current menu — these are my best guess
-- based on typical timing for each treatment type. Please review and
-- adjust any of these in /admin/pricelist (there's already a "Mins"
-- field per item) — only you know the real timing for your services.
-- This only sets a duration where one isn't already set, so it's safe
-- to run even if you've already started filling some in manually.
-- ============================================================

update price_items set duration_minutes = 30 where name = 'Short Blowdry' and duration_minutes is null;
update price_items set duration_minutes = 45 where name = 'Medium/Long Blowdry' and duration_minutes is null;
update price_items set duration_minutes = 60 where name = 'Boho / Curly Blowdry' and duration_minutes is null;
update price_items set duration_minutes = 30 where name = 'Dry Styling' and duration_minutes is null;

update price_items set duration_minutes = 30 where name = 'Short Cut' and duration_minutes is null;
update price_items set duration_minutes = 45 where name = 'Long Cut' and duration_minutes is null;
update price_items set duration_minutes = 60 where name = 'Restyle' and duration_minutes is null;

update price_items set duration_minutes = 60 where name = 'Tint (Short)' and duration_minutes is null;
update price_items set duration_minutes = 75 where name = 'Tint (Long)' and duration_minutes is null;
update price_items set duration_minutes = 45 where name = 'Semi/Demi (Short)' and duration_minutes is null;
update price_items set duration_minutes = 60 where name = 'Semi/Demi (Long)' and duration_minutes is null;
update price_items set duration_minutes = 30 where name = 'Extra Colour' and duration_minutes is null;
update price_items set duration_minutes = 30 where name = 'Colour Boosters' and duration_minutes is null;
update price_items set duration_minutes = 30 where name = 'Cleanse Before Colour' and duration_minutes is null;
update price_items set duration_minutes = 30 where name = 'Masking Treatment' and duration_minutes is null;

update price_items set duration_minutes = 60 where name = 'T-Bar' and duration_minutes is null;
update price_items set duration_minutes = 75 where name = 'T-Bar with Toner' and duration_minutes is null;
update price_items set duration_minutes = 90 where name = '½ Head' and duration_minutes is null;
update price_items set duration_minutes = 90 where name = '½ Head with Toner' and duration_minutes is null;
update price_items set duration_minutes = 90 where name = 'Full Head' and duration_minutes is null;
update price_items set duration_minutes = 90 where name = 'Full Head with Toner' and duration_minutes is null;
update price_items set duration_minutes = 90 where name = 'Bleach Up incl. Toner' and duration_minutes is null;

update price_items set duration_minutes = 90 where name = '½ Head incl. Toner' and duration_minutes is null;
update price_items set duration_minutes = 90 where name = 'Full Head incl. Toner' and duration_minutes is null;

update price_items set duration_minutes = 45 where name = 'Subtle incl. Toner' and duration_minutes is null;
update price_items set duration_minutes = 60 where name = 'Substantial incl. Toner' and duration_minutes is null;

update price_items set duration_minutes = 30 where name = 'Blowdry After Any Colour Service' and duration_minutes is null;
update price_items set duration_minutes = 45 where name = 'Boho / Curly After Colour' and duration_minutes is null;
update price_items set duration_minutes = 30 where name = 'Cut After Colour' and duration_minutes is null;

-- Anything left with no duration at all (custom items you've added since)
-- defaults to 30 minutes so the booking system always has a number to work with.
update price_items set duration_minutes = 30 where duration_minutes is null;
