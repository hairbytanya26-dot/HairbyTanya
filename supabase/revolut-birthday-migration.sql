-- ============================================================
-- Hair by Tanya — Revolut payment, birthdays, birthday vouchers
-- Run this once in Supabase SQL Editor.
-- ============================================================

-- ---------- Revolut request-and-approve flow ----------
-- Reusing the existing voucher_pending_orders table: sumup_checkout_id is
-- simply left null for Revolut requests, and "completed" now means
-- "approved and issued" regardless of payment method.
alter table voucher_pending_orders add column if not exists payment_method text not null default 'revolut';

-- ---------- Birthday capture on mailing list signup ----------
alter table mailing_list_subscribers add column if not exists birth_day int check (birth_day between 1 and 31);
alter table mailing_list_subscribers add column if not exists birth_month int check (birth_month between 1 and 12);

-- ---------- Voucher type (for admin record-keeping) ----------
alter table gift_vouchers add column if not exists voucher_type text not null default 'purchased';
-- Expected values: 'purchased' (via Revolut request), 'manual' (admin-created), 'birthday'
