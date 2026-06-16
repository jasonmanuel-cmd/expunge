-- Expunge: Full schema setup for fresh Supabase project
-- This script is idempotent - safe to run multiple times

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing objects in dependency order (safe reset)
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_profile_created on public.profiles;
drop trigger if exists subscriptions_updated_at on public.subscriptions;
drop trigger if exists orchestrator_memory_updated on public.orchestrator_memory;
drop trigger if exists cases_updated_at on public.cases;
drop trigger if exists dispute_items_updated_at on public.dispute_items;
drop function if exists handle_new_user();
drop function if exists handle_new_subscription();
drop function if exists update_updated_at();
drop function if exists update_last_updated();

drop table if exists public.outcomes cascade;
drop table if exists public.dispatch_records cascade;
drop table if exists public.letters cascade;
drop table if exists public.dispute_items cascade;
drop table if exists public.intelligence_records cascade;
drop table if exists public.orchestrator_memory cascade;
drop table if exists public.dispute_knowledge_base cascade;
drop table if exists public.plan_limits cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.cases cascade;
drop table if exists public.partner_clients cascade;
drop table if exists public.profiles cascade;

drop type if exists public.plan_tier;
drop type if exists public.sub_status;

-- User profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'consumer' check (role in ('consumer', 'partner', 'admin')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Partner to consumer relationships
create table public.partner_clients (
  id uuid primary key default uuid_generate_v4(),
  partner_id uuid references public.profiles(id) on delete cascade not null,
  consumer_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (partner_id, consumer_id)
);

alter table public.partner_clients enable row level security;
create policy "Partners can view own clients" on public.partner_clients for select using (auth.uid() = partner_id);

-- Cases
create table public.cases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'analyzing' check (status in ('analyzing', 'routing', 'active', 'monitoring', 'completed', 'escalated')),
  credit_report_text text,
  credit_report_url text,
  orchestrator_output jsonb,
  source_file text,
  round int not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cases enable row level security;
create policy "Users can view own cases" on public.cases for select using (auth.uid() = user_id);
create policy "Partners can view client cases" on public.cases for select using (
  exists (select 1 from public.partner_clients pc where pc.partner_id = auth.uid() and pc.consumer_id = user_id)
);

-- Dispute items
create table public.dispute_items (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references public.cases(id) on delete cascade not null,
  type text not null check (type in ('bankruptcy', 'credit_card', 'mortgage', 'auto', 'collections', 'public_record', 'fraud', 'inquiry')),
  account_name text not null,
  account_number text,
  bureau text check (bureau in ('equifax', 'experian', 'transunion', 'all')),
  amount numeric,
  dispute_reason text,
  legal_basis text,
  specialist_output jsonb,
  status text not null default 'pending' check (status in ('pending', 'letter_drafted', 'dispatched', 'filed', 'under_review', 'received', 'removed', 'modified', 'verified', 'no_response')),
  round int not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.dispute_items enable row level security;
create policy "Users can view own dispute items" on public.dispute_items for select using (
  exists (select 1 from public.cases c where c.id = case_id and c.user_id = auth.uid())
);

-- Letters
create table public.letters (
  id uuid primary key default uuid_generate_v4(),
  dispute_item_id uuid references public.dispute_items(id) on delete cascade not null,
  bureau text not null check (bureau in ('equifax', 'experian', 'transunion', 'data_furnisher')),
  content text not null,
  round int not null default 1,
  is_cfpb_complaint boolean default false,
  created_at timestamptz default now()
);

alter table public.letters enable row level security;
create policy "Users can view own letters" on public.letters for select using (
  exists (
    select 1 from public.dispute_items di
    join public.cases c on c.id = di.case_id
    where di.id = dispute_item_id and c.user_id = auth.uid()
  )
);

-- Dispatch records
create table public.dispatch_records (
  id uuid primary key default uuid_generate_v4(),
  letter_id uuid references public.letters(id) on delete cascade not null,
  bureau text not null check (bureau in ('equifax', 'experian', 'transunion', 'data_furnisher')),
  tracking_number text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'response_received', 'no_response')),
  sent_at timestamptz,
  response_due_at timestamptz,
  response_received_at timestamptz,
  created_at timestamptz default now()
);

alter table public.dispatch_records enable row level security;
create policy "Users can view own dispatch records" on public.dispatch_records for select using (
  exists (
    select 1 from public.letters l
    join public.dispute_items di on di.id = l.dispute_item_id
    join public.cases c on c.id = di.case_id
    where l.id = letter_id and c.user_id = auth.uid()
  )
);

-- Outcomes
create table public.outcomes (
  id uuid primary key default uuid_generate_v4(),
  dispatch_record_id uuid references public.dispatch_records(id) on delete cascade not null,
  result text not null check (result in ('removed', 'modified', 'verified', 'no_response')),
  score_impact_points int,
  notes text,
  recorded_at timestamptz default now()
);

alter table public.outcomes enable row level security;
create policy "Users can view own outcomes" on public.outcomes for select using (
  exists (
    select 1 from public.dispatch_records dr
    join public.letters l on l.id = dr.letter_id
    join public.dispute_items di on di.id = l.dispute_item_id
    join public.cases c on c.id = di.case_id
    where dr.id = dispatch_record_id and c.user_id = auth.uid()
  )
);

-- Intelligence records
create table public.intelligence_records (
  id uuid primary key default uuid_generate_v4(),
  dispute_type text not null,
  bureau text not null,
  legal_basis text,
  round int not null,
  result text not null,
  days_to_response int,
  recorded_at timestamptz default now()
);

-- Knowledge base
create table public.dispute_knowledge_base (
  id uuid primary key default uuid_generate_v4(),
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

create index idx_kb_category on public.dispute_knowledge_base(category);
create index idx_kb_dispute_types on public.dispute_knowledge_base using gin(dispute_types);
create index idx_kb_bureaus on public.dispute_knowledge_base using gin(bureaus);
create index idx_kb_tags on public.dispute_knowledge_base using gin(tags);

-- Orchestrator memory
create table public.orchestrator_memory (
  id uuid primary key default uuid_generate_v4(),
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

create index idx_mem_dispute_bureau on public.orchestrator_memory(dispute_type, bureau);
create index idx_mem_outcome on public.orchestrator_memory(outcome);

-- Knowledge base RLS
alter table public.dispute_knowledge_base enable row level security;
create policy "Service role full access to knowledge base" on public.dispute_knowledge_base for all using (true) with check (true);

alter table public.orchestrator_memory enable row level security;
create policy "Service role full access to orchestrator memory" on public.orchestrator_memory for all using (true) with check (true);

-- Triggers
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function update_last_updated()
returns trigger as $$
begin
  new.last_updated = now();
  return new;
end;
$$ language plpgsql;

create trigger cases_updated_at before update on public.cases for each row execute function update_updated_at();
create trigger dispute_items_updated_at before update on public.dispute_items for each row execute function update_updated_at();
create trigger orchestrator_memory_updated before update on public.orchestrator_memory for each row execute function update_last_updated();

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, address_line1, address_line2, city, state, zip_code, ssn_last4, date_of_birth)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'consumer'),
    new.raw_user_meta_data->>'address_line1',
    new.raw_user_meta_data->>'address_line2',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'zip_code',
    new.raw_user_meta_data->>'ssn_last4',
    (new.raw_user_meta_data->>'date_of_birth')::date
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Add personal data columns to profiles (idempotent)
alter table public.profiles
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip_code text,
  add column if not exists ssn_last4 text,
  add column if not exists date_of_birth date;

-- Subscriptions
create type public.plan_tier as enum ('free', 'basic', 'pro', 'partner');
create type public.sub_status as enum ('active', 'canceled', 'past_due', 'trialing', 'paused');

create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  plan public.plan_tier not null default 'free',
  status public.sub_status not null default 'active',
  square_customer_id text,
  square_subscription_id text unique,
  square_card_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);

create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function update_updated_at();

-- Auto-create free subscription on profile creation
create or replace function handle_new_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan, status) values (new.id, 'free', 'active');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created after insert on public.profiles for each row execute function handle_new_subscription();

-- Plan limits
create table public.plan_limits (
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
  ('basic',   5,  15, false, false, false,  4900),
  ('pro',     999, 999, true, true,  false,  9900),
  ('partner', 999, 999, true, true,  true,  29900);

alter table public.plan_limits enable row level security;
create policy "Anyone can read plan limits" on public.plan_limits for select using (true);
