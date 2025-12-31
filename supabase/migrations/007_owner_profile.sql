create table if not exists public.owner_profile (
  owner_id uuid primary key references auth.users (id),
  primary_aim jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.update_owner_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_owner_profile_updated on public.owner_profile;
create trigger trg_owner_profile_updated
before update on public.owner_profile
for each row
execute function public.update_owner_profile_updated_at();

alter table public.owner_profile enable row level security;

drop policy if exists "owner_profile_self_select" on public.owner_profile;
create policy "owner_profile_self_select" on public.owner_profile
  for select using (auth.uid() = owner_id);

drop policy if exists "owner_profile_self_upsert" on public.owner_profile;
create policy "owner_profile_self_upsert" on public.owner_profile
  for insert with check (auth.uid() = owner_id);

drop policy if exists "owner_profile_self_update" on public.owner_profile;
create policy "owner_profile_self_update" on public.owner_profile
  for update using (auth.uid() = owner_id);
