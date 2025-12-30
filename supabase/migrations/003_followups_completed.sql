alter table public.followups add column if not exists updated_at timestamptz default now();
alter table public.followups add column if not exists completed_at timestamptz;

drop trigger if exists trg_followups_updated_at on public.followups;
create trigger trg_followups_updated_at
before update on public.followups
for each row
execute procedure public.set_updated_at();
