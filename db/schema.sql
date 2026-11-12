-- Expunge — full database schema for Neon (plain Postgres).
--
-- Replaces supabase/migrations 001-010. Run once on a new, empty database
-- (Neon SQL editor, or: psql "$DATABASE_URL" -f db/schema.sql).
-- Safe to run more than once.
--
-- Differences from the Supabase version:
--   * users / sessions / auth_tokens tables replace Supabase Auth (auth.users).
--   * No row-level security. Every query runs on the server and filters by the
--     signed-in user's id (see lib/db.ts and the access tests).
--   * The signup trigger on auth.users is gone; app/(auth)/actions.ts creates
--     the profile and links invited clients to their firm in one transaction.
--   * The role-change trigger (auth.role()) is gone; the only profile update
--     path (updateMyProfile) never writes the role column.

-- ---------------------------------------------------------------------------
-- Auth
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  -- bcrypt hash. Hashes copied from Supabase (auth.users.encrypted_password)
  -- are bcrypt too, so existing passwords keep working.
  password_hash text not null,
  email_confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists users_email_lower_idx on public.users (lower(email));

create table if not exists public.sessions (
  token_hash text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on public.sessions (user_id);

-- One-time links for email confirmation and password reset.
create table if not exists public.auth_tokens (
  token_hash text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('confirm', 'reset')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists auth_tokens_user_idx on public.auth_tokens (user_id, kind);

-- Failed sign-in attempts, for throttling (kept for one day).
create table if not exists public.login_attempts (
  email text not null,
  at timestamptz not null default now()
);
create index if not exists login_attempts_email_idx on public.login_attempts (email, at);

-- ---------------------------------------------------------------------------
-- Shared trigger functions
-- ---------------------------------------------------------------------------

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.update_last_updated()
returns trigger as $$
begin
  new.last_updated = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Profiles and firms
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'consumer' check (role in ('consumer', 'partner', 'admin')),
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip_code text,
  ssn_last4 text,
  date_of_birth date,
  created_at timestamptz default now()
);

create table if not exists public.partner_clients (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  consumer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (partner_id, consumer_id)
);
create index if not exists partner_clients_consumer_idx on public.partner_clients (consumer_id);
create index if not exists partner_clients_partner_created_idx on public.partner_clients (partner_id, created_at);

create table if not exists public.partner_settings (
  partner_id uuid primary key references public.profiles(id) on delete cascade,
  firm_name text not null check (char_length(firm_name) between 2 and 120),
  logo_url text check (logo_url is null or logo_url like 'https://%'),
  invite_code text not null unique check (invite_code ~ '^[a-z0-9]{10,32}$'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists partner_settings_updated_at on public.partner_settings;
create trigger partner_settings_updated_at
  before update on public.partner_settings
  for each row execute function public.update_updated_at();

-- ---------------------------------------------------------------------------
-- Cases, dispute items, letters, dispatch, outcomes
-- ---------------------------------------------------------------------------

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'analyzing'
    check (status in ('analyzing', 'routing', 'active', 'monitoring', 'completed', 'escalated', 'failed')),
  credit_report_text text,
  credit_report_url text,
  orchestrator_output jsonb,
  round int not null default 1,
  source_file text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists cases_user_idx on public.cases (user_id);
drop trigger if exists cases_updated_at on public.cases;
create trigger cases_updated_at before update on public.cases
  for each row execute function public.update_updated_at();

create table if not exists public.dispute_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  type text not null check (type in ('bankruptcy', 'credit_card', 'mortgage', 'auto', 'collections', 'public_record', 'fraud', 'inquiry')),
  account_name text not null,
  account_number text,
  bureau text check (bureau in ('equifax', 'experian', 'transunion', 'all')),
  amount numeric,
  dispute_reason text,
  legal_basis text,
  specialist_output jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'letter_drafted', 'dispatched', 'filed', 'under_review', 'received', 'removed', 'modified', 'verified', 'no_response')),
  round int not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists dispute_items_case_idx on public.dispute_items (case_id);
drop trigger if exists dispute_items_updated_at on public.dispute_items;
create trigger dispute_items_updated_at before update on public.dispute_items
  for each row execute function public.update_updated_at();

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  dispute_item_id uuid not null references public.dispute_items(id) on delete cascade,
  bureau text not null check (bureau in ('equifax', 'experian', 'transunion', 'data_furnisher')),
  content text not null,
  round int not null default 1,
  is_cfpb_complaint boolean default false,
  created_at timestamptz default now()
);
create index if not exists letters_item_idx on public.letters (dispute_item_id);

create table if not exists public.dispatch_records (
  id uuid primary key default gen_random_uuid(),
  letter_id uuid not null references public.letters(id) on delete cascade,
  bureau text not null check (bureau in ('equifax', 'experian', 'transunion', 'data_furnisher')),
  tracking_number text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'response_received', 'no_response')),
  sent_at timestamptz,
  response_due_at timestamptz,
  response_received_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists dispatch_records_letter_idx on public.dispatch_records (letter_id);

create table if not exists public.outcomes (
  id uuid primary key default gen_random_uuid(),
  dispatch_record_id uuid not null references public.dispatch_records(id) on delete cascade,
  result text not null check (result in ('removed', 'modified', 'verified', 'no_response')),
  score_impact_points int,
  notes text,
  recorded_at timestamptz default now()
);

create table if not exists public.intelligence_records (
  id uuid primary key default gen_random_uuid(),
  dispute_type text not null,
  bureau text not null,
  legal_basis text,
  round int not null,
  result text not null,
  days_to_response int,
  recorded_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Knowledge base and orchestrator memory
-- ---------------------------------------------------------------------------

create table if not exists public.dispute_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in (
    'fcra_law', 'case_law', 'bureau_behavior', 'dispute_strategy',
    'cfpb_enforcement', 'collection_violations', 'metro2_errors',
    'identity_theft', 'statute_of_limitations', 'creditor_patterns'
  )),
  subcategory text,
  title text not null,
  content text not null,
  source text,
  year int,
  dispute_types text[],
  bureaus text[],
  tags text[],
  effectiveness_score numeric default 0.5 check (effectiveness_score between 0 and 1),
  created_at timestamptz default now()
);
create index if not exists idx_kb_category on public.dispute_knowledge_base(category);
create index if not exists idx_kb_dispute_types on public.dispute_knowledge_base using gin(dispute_types);
create index if not exists idx_kb_bureaus on public.dispute_knowledge_base using gin(bureaus);
create index if not exists idx_kb_tags on public.dispute_knowledge_base using gin(tags);

create table if not exists public.orchestrator_memory (
  id uuid primary key default gen_random_uuid(),
  dispute_type text not null,
  bureau text not null,
  legal_basis_used text not null,
  strategy_summary text not null,
  letter_tone text,
  outcome text not null check (outcome in ('removed', 'modified', 'verified', 'no_response')),
  avg_days_to_response numeric,
  round int not null default 1,
  insight text not null,
  confidence_score numeric default 0.5 check (confidence_score between 0 and 1),
  sample_count int default 1,
  success_rate numeric default 0 check (success_rate between 0 and 1),
  last_updated timestamptz default now(),
  created_at timestamptz default now(),
  unique (dispute_type, bureau, legal_basis_used, outcome, round)
);
create index if not exists idx_mem_dispute_bureau on public.orchestrator_memory(dispute_type, bureau);
create index if not exists idx_mem_outcome on public.orchestrator_memory(outcome);
drop trigger if exists orchestrator_memory_updated on public.orchestrator_memory;
create trigger orchestrator_memory_updated
  before update on public.orchestrator_memory
  for each row execute function public.update_last_updated();

-- ---------------------------------------------------------------------------
-- Billing
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.plan_tier as enum ('free', 'basic', 'pro', 'partner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sub_status as enum ('active', 'canceled', 'past_due', 'trialing', 'paused');
exception when duplicate_object then null; end $$;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  plan public.plan_tier not null default 'free',
  status public.sub_status not null default 'active',
  square_customer_id text,
  square_subscription_id text unique,
  square_card_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  client_seats integer check (client_seats is null or client_seats > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at();

-- Every new profile gets a free subscription row (same as Supabase migration 003).
create or replace function public.handle_new_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_subscription();

create table if not exists public.plan_limits (
  plan public.plan_tier primary key,
  max_cases int not null,
  max_items_per_case int not null,
  tri_bureau boolean not null default false,
  escalation_bot boolean not null default false,
  partner_dashboard boolean not null default false,
  monthly_price_cents int not null default 0
);

insert into public.plan_limits values
  ('free',    1,  3,  false, false, false,     0),
  ('basic',   5,  15, true,  false, false,  4900),
  ('pro',     999, 999, true, true,  false,  9900),
  ('partner', 999, 999, true, true,  true,  29900)
on conflict (plan) do nothing;
