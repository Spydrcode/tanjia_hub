-- Demo seed data for Demo Workspace
\set demo_ws '22222222-2222-2222-2222-222222222222'
\set demo_owner '33333333-3333-3333-3333-333333333333'

-- Insert demo leads
insert into public.leads (id, owner_id, name, website, location, notes, status, created_at, updated_at, workspace_id)
values
  ('a1111111-1111-1111-1111-111111111111', :'demo_owner', 'Quiet Studio', 'https://quiet.studio', 'Remote', 'Demo lead: Quiet Studio', 'contacted', now(), now(), :'demo_ws'),
  ('a2222222-2222-2222-2222-222222222222', :'demo_owner', 'Bright Agency', 'https://bright.agency', 'SF', 'Demo lead: Bright Agency', 'warm', now(), now(), :'demo_ws'),
  ('a3333333-3333-3333-3333-333333333333', :'demo_owner', 'North Labs', 'https://northlabs.com', 'NYC', 'Demo lead: North Labs', 'booked', now(), now(), :'demo_ws'),
  ('a4444444-4444-4444-4444-444444444444', :'demo_owner', 'Paper & Ink', 'https://paperandink.co', 'Remote', 'Demo lead: Paper & Ink', 'new', now(), now(), :'demo_ws'),
  ('a5555555-5555-5555-5555-555555555555', :'demo_owner', 'Sunny Co', 'https://sunny.co', 'LA', 'Demo lead: Sunny Co', 'warm', now(), now(), :'demo_ws'),
  ('a6666666-6666-6666-6666-666666666666', :'demo_owner', 'Beta Works', 'https://beta.works', 'Remote', 'Demo lead: Beta Works', 'contacted', now(), now(), :'demo_ws')
on conflict (id) do nothing;

-- Lead snapshots
insert into public.lead_snapshots (id, lead_id, created_at, summary, workspace_id)
values
  (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', now(), 'Quiet Studio: small studio focused on calm UX.', :'demo_ws'),
  (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', now(), 'Bright Agency: mid-sized agency focusing on brand.', :'demo_ws'),
  (gen_random_uuid(), 'a3333333-3333-3333-3333-333333333333', now(), 'North Labs: research-focused team.', :'demo_ws')
on conflict do nothing;

-- Lead analyses
insert into public.lead_analyses (id, lead_id, owner_id, created_at, workspace_id)
values
  (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', :'demo_owner', now(), :'demo_ws'),
  (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', :'demo_owner', now(), :'demo_ws')
on conflict do nothing;

-- Messages (recent activity)
insert into public.messages (id, lead_id, created_at, channel, intent, body, message_type, workspace_id)
values
  (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', now() - interval '2 days', 'comment', 'inbound', 'Hey, can we chat next week about a small project?', 'message', :'demo_ws'),
  (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', now() - interval '1 day', 'email', 'inbound', 'Following up on the intro—interested to learn more.', 'message', :'demo_ws'),
  (gen_random_uuid(), 'a3333333-3333-3333-3333-333333333333', now() - interval '6 days', 'dm', 'inbound', 'Loved your recent post—thinking about collaboration.', 'message', :'demo_ws'),
  (gen_random_uuid(), 'a4444444-4444-4444-4444-444444444444', now() - interval '10 days', 'system', 'booking', 'Booking created', 'system', :'demo_ws')
on conflict do nothing;

-- Networking drafts
insert into public.networking_drafts (id, owner_id, lead_id, created_at, draft, workspace_id)
values
  (gen_random_uuid(), :'demo_owner', 'a1111111-1111-1111-1111-111111111111', now(), 'Thanks for sharing—happy to review.', :'demo_ws'),
  (gen_random_uuid(), :'demo_owner', 'a2222222-2222-2222-2222-222222222222', now(), 'Quick nudge—wanted to check availability.', :'demo_ws'),
  (gen_random_uuid(), :'demo_owner', null, now(), 'Draft for general outreach.', :'demo_ws')
on conflict do nothing;

-- Followups
insert into public.followups (id, lead_id, created_at, due_at, note, done, workspace_id)
values
  (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', now() - interval '5 days', now() - interval '2 days', 'Follow up on homepage review.', false, :'demo_ws'),
  (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', now() - interval '2 days', now(), 'Check availability for intro call.', false, :'demo_ws'),
  (gen_random_uuid(), 'a3333333-3333-3333-3333-333333333333', now() - interval '1 days', now() + interval '1 day', 'Send calendar options', false, :'demo_ws')
on conflict do nothing;

-- Lead bookings
insert into public.lead_bookings (id, owner_id, lead_name, company, status, created_at, start_time, workspace_id)
values
  (gen_random_uuid(), :'demo_owner', 'Alex', 'Quiet Studio', 'accepted', now() - interval '1 day', now() + interval '3 hours', :'demo_ws'),
  (gen_random_uuid(), :'demo_owner', 'Jamie', 'North Labs', 'cancelled', now() - interval '7 days', now() - interval '2 days', :'demo_ws'),
  (gen_random_uuid(), :'demo_owner', 'Taylor', 'Bright Agency', 'accepted', now() - interval '3 days', now() + interval '2 days', :'demo_ws')
on conflict do nothing;

-- Meetings
insert into public.meetings (id, owner_id, title, group_name, start_at, end_at, location_name, address, notes, status, cal_booking_id, created_at, workspace_id)
values
  (gen_random_uuid(), :'demo_owner', 'Intro: Quiet Studio', 'Design Group', now() + interval '3 hours', now() + interval '1 hour 3 hours', 'Zoom', 'zoom.us/123', 'Intro call', 'planned', 'cal_1', now(), :'demo_ws'),
  (gen_random_uuid(), :'demo_owner', 'Deep Dive: North Labs', null, now() + interval '2 days', now() + interval '2 days 1 hour', 'Office', '123 Main St', 'Research call', 'planned', 'cal_2', now(), :'demo_ws'),
  (gen_random_uuid(), :'demo_owner', 'Post-mortem: Paper & Ink', 'Design Group', now() - interval '4 days', now() - interval '4 days' + interval '1 hour', 'HQ', '500 Market', 'Retrospective', 'completed', 'cal_3', now(), :'demo_ws')
on conflict do nothing;

-- Meeting interactions
insert into public.meeting_interactions (id, meeting_id, owner_id, person_name, company_name, role, phone, email, website, notes, tags, followup_priority, lead_id, created_at, workspace_id)
select gen_random_uuid(), m.id, :'demo_owner', 'Alex', 'Quiet Studio', 'Founder', '555-0101', 'alex@quiet.studio', 'https://quiet.studio', 'Met at intro', array['intro'], 'warm', 'a1111111-1111-1111-1111-111111111111', now(), :'demo_ws'
from public.meetings m where m.title ilike '%Quiet Studio%'
union all
select gen_random_uuid(), m.id, :'demo_owner', 'Taylor', 'Bright Agency', 'CDO', '555-0202', 'taylor@bright.agency', 'https://bright.agency', 'Possible project', array['followup'], 'warm', 'a2222222-2222-2222-2222-222222222222', now(), :'demo_ws'
from public.meetings m where m.title ilike '%Bright%'
;

-- Groups and referrals tables will be created by later migration; include simple demo placeholders in json if missing.

-- Workspace members: don't assume current user; reset API will upsert the calling user into workspace_members for demo workspace.

-- End of demo seed
