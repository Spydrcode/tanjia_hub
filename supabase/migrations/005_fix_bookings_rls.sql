-- Enforce owner-only access on lead_bookings
drop policy if exists "Users manage their bookings" on public.lead_bookings;

create policy "Users manage their bookings" on public.lead_bookings
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
