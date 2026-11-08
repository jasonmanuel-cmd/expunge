-- Sale-ready fixes. Safe to run more than once.

-- 1. Basic is sold with letters for all 3 bureaus; make the limit table match.
update public.plan_limits set tri_bureau = true where plan = 'basic';

-- 2. Cases that fail during AI analysis are marked 'failed' instead of
--    staying stuck on 'analyzing'.
alter table public.cases drop constraint if exists cases_status_check;
alter table public.cases add constraint cases_status_check
  check (status in ('analyzing', 'routing', 'active', 'monitoring', 'completed', 'escalated', 'failed'));

-- 3. Users may edit their own profile, but never their own role
--    (stops a customer from making themselves 'admin' or 'partner').
create or replace function public.prevent_profile_role_change()
returns trigger as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') in ('authenticated', 'anon') then
    raise exception 'Changing your account role is not allowed';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_profile_role_change();
