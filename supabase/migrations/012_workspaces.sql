-- Create workspaces and workspace_members, add workspace_id to core tables

-- Workspaces table
create table if not exists public.workspaces (
  id uuid primary key,
  name text not null,
  mode text not null check (mode in ('director','demo')),
  created_at timestamptz default now()
);

-- Workspace members
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer',
  primary key (workspace_id, owner_id)
);

-- Insert deterministic director and demo workspaces (if not exists)
insert into public.workspaces (id, name, mode)
select '11111111-1111-1111-1111-111111111111'::uuid, 'Director Workspace', 'director'
where not exists (select 1 from public.workspaces where id = '11111111-1111-1111-1111-111111111111'::uuid);

insert into public.workspaces (id, name, mode)
select '22222222-2222-2222-2222-222222222222'::uuid, 'Demo Workspace', 'demo'
where not exists (select 1 from public.workspaces where id = '22222222-2222-2222-2222-222222222222'::uuid);

-- Add workspace_id column to core tables and default existing rows to director workspace
-- Leads
alter table public.leads add column if not exists workspace_id uuid;
update public.leads set workspace_id = '11111111-1111-1111-1111-111111111111' where workspace_id is null;
alter table public.leads alter column workspace_id set not null;
create index if not exists idx_leads_workspace_id on public.leads(workspace_id);

-- Lead snapshots
alter table public.lead_snapshots add column if not exists workspace_id uuid;
update public.lead_snapshots set workspace_id = '11111111-1111-1111-1111-111111111111' where workspace_id is null;
alter table public.lead_snapshots alter column workspace_id set not null;
create index if not exists idx_lead_snapshots_workspace_id on public.lead_snapshots(workspace_id);

-- Messages
alter table public.messages add column if not exists workspace_id uuid;
update public.messages set workspace_id = '11111111-1111-1111-1111-111111111111' where workspace_id is null;
alter table public.messages alter column workspace_id set not null;
create index if not exists idx_messages_workspace_id on public.messages(workspace_id);

-- Followups
alter table public.followups add column if not exists workspace_id uuid;
update public.followups set workspace_id = '11111111-1111-1111-1111-111111111111' where workspace_id is null;
alter table public.followups alter column workspace_id set not null;
create index if not exists idx_followups_workspace_id on public.followups(workspace_id);

-- Lead bookings
alter table public.lead_bookings add column if not exists workspace_id uuid;
update public.lead_bookings set workspace_id = '11111111-1111-1111-1111-111111111111' where workspace_id is null;
alter table public.lead_bookings alter column workspace_id set not null;
create index if not exists idx_lead_bookings_workspace_id on public.lead_bookings(workspace_id);

-- Meetings
alter table public.meetings add column if not exists workspace_id uuid;
update public.meetings set workspace_id = '11111111-1111-1111-1111-111111111111' where workspace_id is null;
alter table public.meetings alter column workspace_id set not null;
create index if not exists idx_meetings_workspace_id on public.meetings(workspace_id);

-- Meeting interactions
alter table public.meeting_interactions add column if not exists workspace_id uuid;
update public.meeting_interactions set workspace_id = '11111111-1111-1111-1111-111111111111' where workspace_id is null;
alter table public.meeting_interactions alter column workspace_id set not null;
create index if not exists idx_meeting_interactions_workspace_id on public.meeting_interactions(workspace_id);

-- Networking drafts
alter table public.networking_drafts add column if not exists workspace_id uuid;
update public.networking_drafts set workspace_id = '11111111-1111-1111-1111-111111111111' where workspace_id is null;
alter table public.networking_drafts alter column workspace_id set not null;
create index if not exists idx_networking_drafts_workspace_id on public.networking_drafts(workspace_id);

-- Lead analyses
alter table public.lead_analyses add column if not exists workspace_id uuid;
update public.lead_analyses set workspace_id = '11111111-1111-1111-1111-111111111111' where workspace_id is null;
alter table public.lead_analyses alter column workspace_id set not null;
create index if not exists idx_lead_analyses_workspace_id on public.lead_analyses(workspace_id);

-- Owner profile
alter table public.owner_profile add column if not exists workspace_id uuid;
update public.owner_profile set workspace_id = '11111111-1111-1111-1111-111111111111' where workspace_id is null;
alter table public.owner_profile alter column workspace_id set not null;
create index if not exists idx_owner_profile_workspace_id on public.owner_profile(workspace_id);

-- Adjust RLS policies to include workspace membership

-- Helper: allow members of workspace to access rows
-- Update leads policy
drop policy if exists "Owners can manage their leads" on public.leads;
create policy "Workspace members can manage leads" on public.leads
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));

-- Update lead_snapshots policy
drop policy if exists "Owners can read lead snapshots" on public.lead_snapshots;
create policy "Workspace can read lead snapshots" on public.lead_snapshots
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));

drop policy if exists "Owners can insert lead snapshots" on public.lead_snapshots;
create policy "Workspace can insert lead snapshots" on public.lead_snapshots
  for insert with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));

-- Messages
drop policy if exists "Owners can manage messages" on public.messages;
create policy "Workspace can manage messages" on public.messages
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));

-- Followups
drop policy if exists "Owners can manage followups" on public.followups;
create policy "Workspace can manage followups" on public.followups
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));

-- Meetings and related
drop policy if exists "Owners manage meetings" on public.meetings;
create policy "Workspace manages meetings" on public.meetings
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));

drop policy if exists "Owners manage meeting interactions" on public.meeting_interactions;
create policy "Workspace manages meeting interactions" on public.meeting_interactions
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));

drop policy if exists "Owners manage meeting results" on public.meeting_results;
create policy "Workspace manages meeting results" on public.meeting_results
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));

-- Networking drafts
-- Create simple policy allowing workspace members
alter table public.networking_drafts enable row level security;
drop policy if exists "Owners manage networking drafts" on public.networking_drafts;
create policy "Workspace can manage networking drafts" on public.networking_drafts
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));

-- Lead analyses
alter table public.lead_analyses enable row level security;
drop policy if exists "Owners manage lead analyses" on public.lead_analyses;
create policy "Workspace can manage lead analyses" on public.lead_analyses
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));

-- Owner profile
alter table public.owner_profile enable row level security;
drop policy if exists "Owners manage owner profile" on public.owner_profile;
create policy "Workspace can manage owner profile" on public.owner_profile
  using (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.owner_id = auth.uid()));

-- Note: Further tables (groups, referrals) will be added in a later migration.
