-- Fix orchestrator_memory trigger: column is last_updated, not updated_at
-- The old trigger used update_updated_at() which sets new.updated_at, but the table has last_updated

drop trigger if exists orchestrator_memory_updated on public.orchestrator_memory;

create or replace function update_last_updated()
returns trigger as $$
begin
  new.last_updated = now();
  return new;
end;
$$ language plpgsql;

create trigger orchestrator_memory_updated
  before update on public.orchestrator_memory
  for each row execute function update_last_updated();
