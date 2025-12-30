-- Attribution and review for lead_bookings
alter table public.lead_bookings alter column user_id drop not null;
alter table public.lead_bookings add column if not exists owner_id uuid;
alter table public.lead_bookings add column if not exists needs_review boolean not null default false;
alter table public.lead_bookings add column if not exists match_reason text;

update public.lead_bookings set owner_id = user_id where owner_id is null;

create index if not exists lead_bookings_needs_review_idx on public.lead_bookings(needs_review);
create index if not exists lead_bookings_owner_id_idx on public.lead_bookings(owner_id);
create index if not exists lead_bookings_created_at_idx on public.lead_bookings(created_at);

drop policy if exists "Users manage their bookings" on public.lead_bookings;
create policy "Users manage their bookings" on public.lead_bookings
  using (auth.uid() = coalesce(owner_id, user_id))
  with check (auth.uid() = coalesce(owner_id, user_id));
