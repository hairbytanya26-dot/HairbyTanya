-- ============================================================
-- Hair by Tanya — Colour processing gap support
-- Run this once in Supabase SQL Editor.
-- ============================================================

-- A "split" booking (colour service + finishing service) creates two
-- separate Google Calendar events with a gap between them, so we need
-- somewhere to store the second event's id alongside the first.
alter table bookings add column if not exists second_event_id text;
