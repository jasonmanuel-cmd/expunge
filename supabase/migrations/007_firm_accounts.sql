-- Expunge — Firm accounts (tax pros and other businesses pay one monthly
-- fee; their invited clients use Expunge without paying).
--
-- Adds:
--   * partner_settings: a firm's display name, logo and private invite code
--   * a policy so a client can see which firm sponsors them
--   * signup trigger that links a new client to the firm whose invite they used
--   * signup hardening: self-signup can only create 'consumer' or 'partner'

create table if not exists public.partner_settings (
  partner_id uuid primary key references public.profiles(id) on delete cascade,
  firm_name text not null check (char_length(firm_name) between 2 and 120),
  logo_url text check (logo_url is null or logo_url like 'https://%'),
  invite_code text not null unique check (invite_code ~ '^[a-z0-9]{10,32}$'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.partner_settings enable row level security;

-- Firms can read their own settings. All writes go through server routes
-- that use the service role, so no insert/update policy is granted.
drop policy if exists "Partners can view own settings" on public.partner_settings;
create policy "Partners can view own settings"
  on public.partner_settings for select using (auth.uid() = partner_id);

drop trigger if exists partner_settings_updated_at on public.partner_settings;
create trigger partner_settings_updated_at
  before update on public.partner_settings
  for each row execute function update_updated_at();

-- Clients can see their own firm link (used to show the firm's branding).
drop policy if exists "Consumers can view own partner link" on public.partner_clients;
create policy "Consumers can view own partner link"
  on public.partner_clients for select using (auth.uid() = consumer_id);

create index if not exists partner_clients_consumer_idx
  on public.partner_clients (consumer_id);

-- Signup trigger. Same fields as migration 005, plus:
--   * role is limited to consumer/partner (metadata is user-controlled, so a
--     signup must never be able to claim 'admin')
--   * empty date strings no longer break the ::date cast (firm signups don't
--     collect a date of birth)
--   * a consumer who signed up through a firm's invite link is linked to it
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := case
    when new.raw_user_meta_data->>'role' = 'partner' then 'partner'
    else 'consumer'
  end;
  v_invite text := lower(nullif(trim(new.raw_user_meta_data->>'invite_code'), ''));
  v_partner uuid;
begin
  insert into public.profiles (id, email, full_name, role, address_line1, address_line2, city, state, zip_code, ssn_last4, date_of_birth)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    v_role,
    nullif(new.raw_user_meta_data->>'address_line1', ''),
    nullif(new.raw_user_meta_data->>'address_line2', ''),
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'state', ''),
    nullif(new.raw_user_meta_data->>'zip_code', ''),
    nullif(new.raw_user_meta_data->>'ssn_last4', ''),
    nullif(new.raw_user_meta_data->>'date_of_birth', '')::date
  );

  if v_role = 'consumer' and v_invite is not null then
    select partner_id into v_partner
      from public.partner_settings
      where invite_code = v_invite;
    if v_partner is not null then
      insert into public.partner_clients (partner_id, consumer_id)
      values (v_partner, new.id)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;
