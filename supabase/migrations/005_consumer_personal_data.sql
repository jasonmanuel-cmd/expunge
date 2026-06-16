-- Expunge — Consumer personal data for dispute letters
-- Adds address, SSN last 4, and DOB columns to profiles

-- Add personal data columns to profiles table
alter table public.profiles
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip_code text,
  add column if not exists ssn_last4 text,
  add column if not exists date_of_birth date;

-- Update handle_new_user() trigger to accept personal data fields from raw_user_meta_data
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

-- RLS: The existing policies ("Users can view own profile" and "Users can update own profile")
-- already cover all columns via auth.uid() = id, so no new policies are needed.
-- The new columns inherit access control from the existing profile RLS policies.

-- Add comments for documentation
comment on column public.profiles.address_line1 is 'Street address line 1 — required for dispute letters';
comment on column public.profiles.address_line2 is 'Street address line 2 (apt, suite, etc.) — optional';
comment on column public.profiles.city is 'City — required for dispute letters';
comment on column public.profiles.state is '2-letter state abbreviation — required for dispute letters';
comment on column public.profiles.zip_code is 'ZIP code — required for dispute letters';
comment on column public.profiles.ssn_last4 is 'Last 4 digits of SSN — required for bureau verification in letters';
comment on column public.profiles.date_of_birth is 'Date of birth — required for bureau verification in letters';
