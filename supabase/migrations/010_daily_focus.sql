-- Daily focus table for Clarify zone
create table if not exists public.daily_focus (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  focus_date date not null default current_date,
  slot_number int not null check (slot_number between 1 and 3),
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  reason text,
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint daily_focus_unique_slot unique (owner_id, focus_date, slot_number)
);

create index daily_focus_owner_date_idx on public.daily_focus(owner_id, focus_date);
create index daily_focus_lead_idx on public.daily_focus(lead_id);

-- RLS
alter table public.daily_focus enable row level security;

drop policy if exists "Owners manage their daily focus" on public.daily_focus;
create policy "Owners manage their daily focus" on public.daily_focus
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_daily_focus_updated_at on public.daily_focus;
create trigger trg_daily_focus_updated_at
before update on public.daily_focus
for each row
execute function public.set_updated_at();
