-- ============================================================
-- Hair by Tanya — Recurring weekly working hours
-- Run this once in Supabase SQL Editor.
-- ============================================================

create table if not exists working_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null unique check (day_of_week between 0 and 6), -- 0=Sunday .. 6=Saturday
  start_time text not null,  -- "HH:MM" 24-hour, Dublin local time
  end_time text not null,
  is_active boolean not null default true
);

alter table working_hours enable row level security;

create policy "public read active working_hours" on working_hours
  for select using (is_active = true);

create policy "admin manage working_hours" on working_hours
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed all 7 days (inactive by default), then set the 3 real working days.
insert into working_hours (day_of_week, start_time, end_time, is_active) values
  (0, '09:00', '17:00', false), -- Sunday
  (1, '09:00', '17:00', false), -- Monday
  (2, '09:00', '17:00', false), -- Tuesday
  (3, '09:30', '17:00', true),  -- Wednesday
  (4, '09:30', '20:00', true),  -- Thursday
  (5, '09:00', '17:00', false), -- Friday
  (6, '08:30', '15:00', true)   -- Saturday
on conflict (day_of_week) do update set
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  is_active = excluded.is_active;
