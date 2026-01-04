-- Networking groups and referrals

create table if not exists public.networking_groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  name text not null,
  cadence text,
  location_name text,
  address text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.group_attendance (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  group_id uuid not null references public.networking_groups(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete set null,
  met_at timestamptz default now(),
  attendees_count int default 0,
  notes text
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  from_person text,
  from_company text,
  to_lead_id uuid references public.leads(id) on delete set null,
  to_name text,
  type text default 'in',
  value_estimate numeric,
  status text default 'new',
  next_followup_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- RLS policies: restrict by workspace membership
alter table public.networking_groups enable row level security;
create policy "Workspace can manage groups" on public.networking_groups
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));

alter table public.group_attendance enable row level security;
create policy "Workspace can manage attendance" on public.group_attendance
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));

alter table public.referrals enable row level security;
create policy "Workspace can manage referrals" on public.referrals
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));
