-- Company overview analyses
create table if not exists public.company_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lead_id uuid references public.leads(id) on delete set null,
  input_url text not null,
  deep_scan boolean default false,
  version text not null,
  confidence text not null default 'low',
  snapshot jsonb not null,
  inference jsonb not null,
  next_actions jsonb not null,
  evidence jsonb,
  missing_signals jsonb,
  created_at timestamptz default now()
);

create index if not exists company_analyses_user_idx on public.company_analyses(user_id);
create index if not exists company_analyses_lead_idx on public.company_analyses(lead_id);
create index if not exists company_analyses_created_idx on public.company_analyses(created_at desc);

-- Evidence table (optional normalization)
create table if not exists public.company_analysis_evidence (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.company_analyses(id) on delete cascade,
  type text,
  url text,
  snippet text,
  created_at timestamptz default now()
);

create index if not exists company_analysis_evidence_analysis_idx on public.company_analysis_evidence(analysis_id);

-- Action items table (optional normalization)
create table if not exists public.company_action_items (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.company_analyses(id) on delete cascade,
  category text,
  title text,
  why text,
  question text,
  confidence text,
  created_at timestamptz default now()
);

create index if not exists company_action_items_analysis_idx on public.company_action_items(analysis_id);

-- Enable RLS
alter table public.company_analyses enable row level security;
alter table public.company_analysis_evidence enable row level security;
alter table public.company_action_items enable row level security;

-- Policies for company_analyses
drop policy if exists "Users manage their company analyses" on public.company_analyses;
create policy "Users manage their company analyses" on public.company_analyses
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for company_analysis_evidence
drop policy if exists "Users manage their analysis evidence" on public.company_analysis_evidence;
create policy "Users manage their analysis evidence" on public.company_analysis_evidence
  using (
    exists (
      select 1 from public.company_analyses ca
      where ca.id = analysis_id and ca.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.company_analyses ca
      where ca.id = analysis_id and ca.user_id = auth.uid()
    )
  );

-- Policies for company_action_items
drop policy if exists "Users manage their analysis action items" on public.company_action_items;
create policy "Users manage their analysis action items" on public.company_action_items
  using (
    exists (
      select 1 from public.company_analyses ca
      where ca.id = analysis_id and ca.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.company_analyses ca
      where ca.id = analysis_id and ca.user_id = auth.uid()
    )
  );
