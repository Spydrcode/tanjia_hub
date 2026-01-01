-- Networking drafts table for storing generated replies
create table if not exists public.networking_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz default now(),
  channel text not null check (channel in ('comment', 'dm', 'email')),
  goal text check (goal in ('reflect', 'invite', 'schedule', 'encourage')),
  input_text text not null,
  input_notes text,
  reply_text text,
  followup_question text,
  second_look_note text,
  metadata jsonb default '{}'
);

create index if not exists networking_drafts_owner_idx on public.networking_drafts(owner_id);
create index if not exists networking_drafts_lead_idx on public.networking_drafts(lead_id);
create index if not exists networking_drafts_created_idx on public.networking_drafts(created_at desc);

-- Lead analyses table for storing website analysis results
create table if not exists public.lead_analyses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz default now(),
  url text,
  growth_changes text[] default '{}',
  friction_points text[] default '{}',
  calm_next_steps text[] default '{}',
  raw_summary text,
  metadata jsonb default '{}'
);

create index if not exists lead_analyses_owner_idx on public.lead_analyses(owner_id);
create index if not exists lead_analyses_lead_idx on public.lead_analyses(lead_id);
create index if not exists lead_analyses_created_idx on public.lead_analyses(created_at desc);

-- RLS for networking_drafts
alter table public.networking_drafts enable row level security;

drop policy if exists "Owners can manage their networking drafts" on public.networking_drafts;
create policy "Owners can manage their networking drafts" on public.networking_drafts
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- RLS for lead_analyses  
alter table public.lead_analyses enable row level security;

drop policy if exists "Owners can manage their lead analyses" on public.lead_analyses;
create policy "Owners can manage their lead analyses" on public.lead_analyses
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
