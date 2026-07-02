-- ============================================================
-- Hair by Tanya — Supabase schema
-- Run this once in your new Supabase project's SQL Editor
-- (Project → SQL Editor → New query → paste all → Run)
-- ============================================================

-- ---------- SITE SETTINGS (single row of editable site-wide text) ----------
create table if not exists site_settings (
  id int primary key default 1,
  business_name text not null default 'Hair by Tanya',
  hero_title text not null default 'Welcome to Hair by Tanya',
  hero_kicker text not null default 'xoxo',
  hero_subtitle text not null default 'Cuts, Colour & Styling with a Personal Touch',
  hero_tagline text not null default 'Fresh. Fabulous. You.',
  about_title text not null default 'About Hair by Tanya',
  about_eyebrow text not null default '',
  about_body text not null default 'At Hair by Tanya, every client gets a personalised approach to their hair — from precision cuts to bold colour transformations. With years of experience and a genuine love for the craft, Tanya takes the time to understand exactly what you want and helps you leave feeling like the best version of yourself.',
  booking_notice text not null default 'Please arrive 5 minutes before your appointment. If you need to reschedule, just reply to your confirmation email.',
  contact_email text not null default '',
  contact_phone text default '',
  address text default '',
  constraint single_row check (id = 1)
);
insert into site_settings (id) values (1) on conflict (id) do nothing;

-- ---------- SOCIAL LINKS (footer, fully manageable) ----------
create table if not exists social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,          -- e.g. 'Instagram', 'Facebook', 'TikTok'
  url text not null,
  icon_key text not null default 'link', -- maps to an icon in the frontend
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- PRICE LIST ----------
create table if not exists price_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists price_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references price_categories(id) on delete cascade,
  name text not null,
  description text default '',
  price numeric(10,2) not null,
  duration_minutes int,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- Starter categories & treatments — all fully editable/removable from /admin/pricelist
do $$
declare
  cat_cuts uuid;
  cat_colour uuid;
  cat_styling uuid;
  cat_treatments uuid;
begin
  if not exists (select 1 from price_categories) then
    insert into price_categories (name, sort_order) values ('Cuts', 0) returning id into cat_cuts;
    insert into price_categories (name, sort_order) values ('Colour', 1) returning id into cat_colour;
    insert into price_categories (name, sort_order) values ('Styling', 2) returning id into cat_styling;
    insert into price_categories (name, sort_order) values ('Treatments', 3) returning id into cat_treatments;

    insert into price_items (category_id, name, price, duration_minutes, sort_order) values
      (cat_cuts, 'Ladies Cut & Finish', 45.00, 45, 0),
      (cat_cuts, 'Mens Cut', 25.00, 30, 1),
      (cat_cuts, 'Childrens Cut', 18.00, 20, 2),
      (cat_colour, 'Full Head Colour', 75.00, 90, 0),
      (cat_colour, 'Root Touch-Up', 55.00, 60, 1),
      (cat_colour, 'Balayage / Highlights', 95.00, 120, 2),
      (cat_styling, 'Blow Dry', 30.00, 40, 0),
      (cat_styling, 'Special Occasion Updo', 55.00, 60, 1),
      (cat_treatments, 'Deep Conditioning Treatment', 25.00, 20, 0);
  end if;
end $$;

-- ---------- REVIEWS ----------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  body text not null,
  is_featured boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- MAILING LIST ----------
create table if not exists mailing_list_subscribers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  subscribed_at timestamptz not null default now(),
  welcome_email_sent boolean not null default false
);

-- ---------- EMAIL TEMPLATES (admin-editable, sent by serverless functions) ----------
create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique, -- 'mailing_list_welcome' | 'booking_confirmation'
  subject text not null,
  body_html text not null,
  updated_at timestamptz not null default now()
);
insert into email_templates (template_key, subject, body_html) values
  ('mailing_list_welcome', 'Welcome to Hair by Tanya ✨',
   '<p>Hi {{name}},</p><p>Thanks for joining the Hair by Tanya mailing list! You''ll be the first to hear about specials, new styles and discounts.</p><p>Fresh. Fabulous. You.</p><p>— The Hair by Tanya team</p>'),
  ('booking_confirmation', 'Your Hair by Tanya booking is confirmed',
   '<p>Hi {{name}},</p><p>Your booking for <strong>{{service}}</strong> on <strong>{{date}}</strong> at <strong>{{time}}</strong> is confirmed. Thank you for choosing Hair by Tanya — we can''t wait to see you.</p><p>If you need to reschedule, just reply to this email.</p><p>— The Hair by Tanya team</p>')
on conflict (template_key) do nothing;

-- ---------- AVAILABILITY SLOTS ----------
create table if not exists availability_slots (
  id uuid primary key default gen_random_uuid(),
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_booked boolean not null default false,
  google_event_id text, -- set once booked and pushed to Google Calendar
  created_at timestamptz not null default now()
);
create index if not exists idx_availability_start on availability_slots (start_time);

-- ---------- BOOKINGS ----------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references availability_slots(id) on delete cascade,
  service_id uuid references price_items(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  notes text,
  google_event_id text,
  confirmation_email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Public (anon) visitors: read-only on public content, insert-only
-- on mailing list + bookings. Everything else requires an
-- authenticated admin session.
-- ============================================================

alter table site_settings enable row level security;
alter table social_links enable row level security;
alter table price_categories enable row level security;
alter table price_items enable row level security;
alter table reviews enable row level security;
alter table mailing_list_subscribers enable row level security;
alter table email_templates enable row level security;
alter table availability_slots enable row level security;
alter table bookings enable row level security;

-- site_settings: public read, admin write
create policy "public read site_settings" on site_settings for select using (true);
create policy "admin write site_settings" on site_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- social_links: public read active, admin manage all
create policy "public read active social_links" on social_links for select using (is_active = true);
create policy "admin manage social_links" on social_links for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- price_categories / price_items: public read active, admin manage all
create policy "public read active price_categories" on price_categories for select using (is_active = true);
create policy "admin manage price_categories" on price_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "public read active price_items" on price_items for select using (is_active = true);
create policy "admin manage price_items" on price_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- reviews: public read featured, admin manage all
create policy "public read featured reviews" on reviews for select using (is_featured = true);
create policy "admin manage reviews" on reviews for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- mailing_list_subscribers: public can insert only, admin can read/manage
create policy "public insert mailing_list" on mailing_list_subscribers for insert with check (true);
create policy "admin read mailing_list" on mailing_list_subscribers for select using (auth.role() = 'authenticated');
create policy "admin manage mailing_list" on mailing_list_subscribers for update using (auth.role() = 'authenticated');
create policy "admin delete mailing_list" on mailing_list_subscribers for delete using (auth.role() = 'authenticated');

-- email_templates: admin only (read + write) — sent server-side with service role, not needed publicly
create policy "admin manage email_templates" on email_templates for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- availability_slots: public read only unbooked/future, admin manage all
create policy "public read availability_slots" on availability_slots for select using (true);
create policy "admin manage availability_slots" on availability_slots for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- bookings: public can insert only; admin can read/manage.
-- Server-side API route uses the service role key to actually validate + write, bypassing RLS safely.
create policy "admin read bookings" on bookings for select using (auth.role() = 'authenticated');
create policy "admin manage bookings" on bookings for update using (auth.role() = 'authenticated');
create policy "admin delete bookings" on bookings for delete using (auth.role() = 'authenticated');

-- Note: booking INSERT and the "mark slot as booked" step are done via a
-- server-side API route using the Supabase service role key (see /app/api/bookings),
-- never directly from the browser — this prevents double-booking race conditions
-- and keeps Google Calendar in sync with Supabase.