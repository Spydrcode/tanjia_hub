-- Meetings core tables
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  title text not null,
  group_name text,
  start_at timestamptz not null,
  end_at timestamptz,
  location_name text,
  address text,
  notes text,
  status text not null default 'planned',
  started_at timestamptz,
  completed_at timestamptz,
  cal_booking_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.meeting_interactions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  person_name text,
  company_name text,
  role text,
  phone text,
  email text,
  website text,
  notes text,
  tags text[],
  followup_priority text not null default 'warm',
  lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.meeting_results (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  summary_md text not null,
  followup_plan_json jsonb not null,
  intro_tests_json jsonb not null,
  improvements_json jsonb not null,
  created_at timestamptz default now()
);

-- RLS
alter table public.meetings enable row level security;
alter table public.meeting_interactions enable row level security;
alter table public.meeting_results enable row level security;

drop policy if exists "Owners manage meetings" on public.meetings;
create policy "Owners manage meetings" on public.meetings
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Owners manage meeting interactions" on public.meeting_interactions;
create policy "Owners manage meeting interactions" on public.meeting_interactions
  using (
    owner_id = auth.uid()
    and meeting_id in (select id from public.meetings where owner_id = auth.uid())
  )
  with check (
    owner_id = auth.uid()
    and meeting_id in (select id from public.meetings where owner_id = auth.uid())
  );

drop policy if exists "Owners manage meeting results" on public.meeting_results;
create policy "Owners manage meeting results" on public.meeting_results
  using (
    owner_id = auth.uid()
    and meeting_id in (select id from public.meetings where owner_id = auth.uid())
  )
  with check (
    owner_id = auth.uid()
    and meeting_id in (select id from public.meetings where owner_id = auth.uid())
  );
