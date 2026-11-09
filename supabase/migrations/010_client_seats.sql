-- Client seats per firm. Safe to run more than once.
--
-- Each firm plan includes a number of client seats (lib/pricing.ts). Checkout
-- saves the plan's count here; raise it for a firm that buys more seats.
-- Null means the Firm Monthly default.

alter table public.subscriptions
  add column if not exists client_seats integer;

alter table public.subscriptions
  drop constraint if exists subscriptions_client_seats_positive;
alter table public.subscriptions
  add constraint subscriptions_client_seats_positive
  check (client_seats is null or client_seats > 0);

-- Seats are given out in join order, so make that lookup fast.
create index if not exists partner_clients_partner_created_idx
  on public.partner_clients (partner_id, created_at);
