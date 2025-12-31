-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Leads table
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  website text,
  location text,
  notes text,
  tags text[] default '{}',
  status text default 'new',
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists leads_email_idx on public.leads(lower(email));

-- Lead snapshots
create table if not exists public.lead_snapshots (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  created_at timestamptz default now(),
  source_urls text[] default '{}',
  summary text,
  extracted_json jsonb,
  tokens_estimate int
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  created_at timestamptz default now(),
  channel text,
  intent text,
  body text,
  is_sent boolean default false,
  message_type text,
  metadata jsonb
);

-- Followups
create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  created_at timestamptz default now(),
  due_at timestamptz,
  note text,
  done boolean default false,
  completed_at timestamptz
);

-- Updated_at trigger for leads
create or replace function public.set_leads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
before update on public.leads
for each row
execute function public.set_leads_updated_at();

-- RLS
alter table public.leads enable row level security;
alter table public.lead_snapshots enable row level security;
alter table public.messages enable row level security;
alter table public.followups enable row level security;

drop policy if exists "Owners can manage their leads" on public.leads;
create policy "Owners can manage their leads" on public.leads
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can read lead snapshots" on public.lead_snapshots;
create policy "Owners can read lead snapshots" on public.lead_snapshots
  using (auth.uid() = (select owner_id from public.leads where id = lead_id));

drop policy if exists "Owners can insert lead snapshots" on public.lead_snapshots;
create policy "Owners can insert lead snapshots" on public.lead_snapshots
  for insert with check (auth.uid() = (select owner_id from public.leads where id = lead_id));

drop policy if exists "Owners can manage messages" on public.messages;
create policy "Owners can manage messages" on public.messages
  using (auth.uid() = (select owner_id from public.leads where id = lead_id))
  with check (auth.uid() = (select owner_id from public.leads where id = lead_id));

drop policy if exists "Owners can manage followups" on public.followups;
create policy "Owners can manage followups" on public.followups
  using (auth.uid() = (select owner_id from public.leads where id = lead_id))
  with check (auth.uid() = (select owner_id from public.leads where id = lead_id));
