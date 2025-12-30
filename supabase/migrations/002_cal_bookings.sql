-- Lead bookings (Cal.com)
create table if not exists public.lead_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lead_id uuid null references public.leads(id) on delete set null,
  provider text not null default 'cal',
  cal_booking_id text unique,
  cal_event_type text,
  duration_minutes int,
  start_time timestamptz,
  end_time timestamptz,
  timezone text,
  attendee_name text,
  attendee_email text,
  status text,
  raw_payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists lead_bookings_user_id_idx on public.lead_bookings(user_id);
create index if not exists lead_bookings_lead_id_idx on public.lead_bookings(lead_id);
create index if not exists lead_bookings_cal_booking_id_idx on public.lead_bookings(cal_booking_id);

alter table public.lead_bookings enable row level security;

create policy "Users manage their bookings" on public.lead_bookings
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists trg_lead_bookings_updated_at on public.lead_bookings;
create trigger trg_lead_bookings_updated_at
before update on public.lead_bookings
for each row
execute procedure public.set_updated_at();

-- Messages: support scheduling instrumentation
alter table public.messages add column if not exists owner_id uuid;
alter table public.messages add column if not exists message_type text;
alter table public.messages add column if not exists metadata jsonb default '{}'::jsonb;

update public.messages m
set owner_id = l.owner_id
from public.leads l
where m.lead_id = l.id
  and m.owner_id is null;

drop policy if exists "Owners can manage messages" on public.messages;
create policy "Owners can manage messages" on public.messages
  using (auth.uid() = owner_id or auth.uid() = (select owner_id from public.leads where id = lead_id))
  with check (auth.uid() = owner_id or auth.uid() = (select owner_id from public.leads where id = lead_id));

create index if not exists messages_owner_id_idx on public.messages(owner_id);
create index if not exists messages_message_type_idx on public.messages(message_type);

-- Leads: optional email for booking matching
alter table public.leads add column if not exists email text;
create index if not exists leads_email_idx on public.leads(lower(email));
