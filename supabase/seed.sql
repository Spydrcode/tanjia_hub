-- Demo seed data for local Supabase development
-- Context: owner-led service businesses for 2ndmynd demo flows
-- Tone: calm, observational, presentation-ready (no real personal data)

-- Reset only known demo rows for repeatable seeds
delete from public.followups where id in (
  '0c86d5ec-0f0b-4759-91b2-977c2a46f0c1',
  '41d42d62-3a8b-4efd-8549-7fb9cf37d805',
  '6659fb1c-2d91-48f8-9c0a-6b006430fa5f',
  '79ff2be8-4a4c-4d41-9fc8-231645114fb6',
  'f0f5cedb-d70a-4e26-8f4d-7b63e839120d'
);

delete from public.lead_snapshots where id in (
  '1bd59e1c-97ec-4e34-aead-bae88f23b0ff',
  '374b8616-2e4c-4f45-b77c-745ae8dc9508',
  '5d2efec3-6bc8-45ab-8c4b-3c5f21a4179d',
  '7a45a691-4f89-41c7-9f8f-2d8bc9737e8b',
  'a96e1c7f-c726-4a34-a687-3b4a2110df11'
);

delete from public.leads where id in (
  '4f4d205e-e7f3-4a1a-9d21-4f25a1af7b15',
  '57733b6c-0d63-4678-a1c4-5189b25e6d78',
  '64c8a2f0-4287-4dc9-9a7e-4ad59ad8054a',
  '6bd8789e-9095-4c07-847f-024b65d15e96',
  '7c2c132d-5e8e-4f7d-a447-6e7c09b0e6d5',
  'bbcb9241-779a-4d79-a455-3ad43d0e3c29',
  'd0d1f5a4-905b-4d45-bf32-b5e180527130',
  'd21a1c18-8cff-4bfb-b5b4-c27c1e38f1eb',
  'e8c3c980-61bb-4f43-b893-6fd04e76d1fb'
);

delete from auth.identities where user_id in (
  'a09f1b37-4d15-4c9b-b2e7-d2ca8ea050e1',
  'b1a055b6-ace9-4dd9-8c4c-731aad6b72e8',
  'c7bb2a6f-862a-4e44-9a6f-37f095bf6be9'
);

delete from auth.users where id in (
  'a09f1b37-4d15-4c9b-b2e7-d2ca8ea050e1',
  'b1a055b6-ace9-4dd9-8c4c-731aad6b72e8',
  'c7bb2a6f-862a-4e44-9a6f-37f095bf6be9'
);

-- Demo owners (confirmed users with calm, practical profiles)
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
) values
  (
    'a09f1b37-4d15-4c9b-b2e7-d2ca8ea050e1',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'marisol@evergreen-demo.local',
    crypt('quiet-evergreen', gen_salt('bf')),
    now(),
    now(),
    '',
    '',
    '',
    '{"provider":"email"}',
    '{"first_name":"Marisol","role":"Owner-Operator","business_name":"Evergreen Hearth & Air","years_in_business":9,"notes":"Still handles scheduling and estimates; keeps crews small and steady."}',
    false,
    now(),
    now()
  ),
  (
    'b1a055b6-ace9-4dd9-8c4c-731aad6b72e8',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'darius@ridgeplumbing.local',
    crypt('quiet-ridge', gen_salt('bf')),
    now(),
    now(),
    '',
    '',
    '',
    '{"provider":"email"}',
    '{"first_name":"Darius","role":"Owner-Operator","business_name":"Coleman Ridge Plumbing","years_in_business":12,"notes":"Prefers steady municipal work; keeps estimates modest."}',
    false,
    now(),
    now()
  ),
  (
    'c7bb2a6f-862a-4e44-9a6f-37f095bf6be9',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'tessa@redriverpropane.local',
    crypt('quiet-redriver', gen_salt('bf')),
    now(),
    now(),
    '',
    '',
    '',
    '{"provider":"email"}',
    '{"first_name":"Tessa","role":"Owner-Operator","business_name":"Red River Propane Services","years_in_business":7,"notes":"Handles safety calls personally; small crew rotates on-call."}',
    false,
    now(),
    now()
  )
on conflict (id) do update set
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

-- Mirror identities so local login works with email provider
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values
  (
    'f1b104c0-8f74-4b15-b120-4a9906dd0496',
    'a09f1b37-4d15-4c9b-b2e7-d2ca8ea050e1',
    jsonb_build_object('sub', 'a09f1b37-4d15-4c9b-b2e7-d2ca8ea050e1', 'email', 'marisol@evergreen-demo.local', 'email_verified', true),
    'email',
    'marisol@evergreen-demo.local',
    now(),
    now(),
    now()
  ),
  (
    'af4d7574-2c94-479f-9f22-6a1ce9990402',
    'b1a055b6-ace9-4dd9-8c4c-731aad6b72e8',
    jsonb_build_object('sub', 'b1a055b6-ace9-4dd9-8c4c-731aad6b72e8', 'email', 'darius@ridgeplumbing.local', 'email_verified', true),
    'email',
    'darius@ridgeplumbing.local',
    now(),
    now(),
    now()
  ),
  (
    '390b0c14-38db-41a2-b934-658cd2a0db40',
    'c7bb2a6f-862a-4e44-9a6f-37f095bf6be9',
    jsonb_build_object('sub', 'c7bb2a6f-862a-4e44-9a6f-37f095bf6be9', 'email', 'tessa@redriverpropane.local', 'email_verified', true),
    'email',
    'tessa@redriverpropane.local',
    now(),
    now(),
    now()
  )
on conflict (id) do nothing;

-- Businesses (stored as lead records tagged as business profiles)
insert into public.leads (
  id,
  owner_id,
  name,
  website,
  location,
  notes,
  tags,
  status,
  created_at,
  updated_at,
  email
) values
  (
    'bbcb9241-779a-4d79-a455-3ad43d0e3c29',
    'a09f1b37-4d15-4c9b-b2e7-d2ca8ea050e1',
    'Evergreen Hearth & Air',
    'https://evergreenhearth.example.com',
    'Tacoma, WA',
    'Nine-year HVAC shop; Marisol still handles scheduling and estimates. Team of 6 steady techs and apprentices. Growth is pushing response times.',
    array['type:business-profile','industry:hvac','years_operating:9','team_size:6','owner_role:Owner-Operator'],
    'active',
    '2024-12-28T14:00:00Z',
    '2024-12-28T14:00:00Z',
    'hello@evergreenhearth.example.com'
  ),
  (
    '7c2c132d-5e8e-4f7d-a447-6e7c09b0e6d5',
    'b1a055b6-ace9-4dd9-8c4c-731aad6b72e8',
    'Coleman Ridge Plumbing',
    'https://ridgeplumbing.example.com',
    'Boise, ID',
    'Twelve years in, keeps a five-person crew focused on residential re-pipes and municipal repair. Darius balances estimates with hands-on troubleshooting.',
    array['type:business-profile','industry:plumbing','years_operating:12','team_size:5','owner_role:Owner-Operator'],
    'active',
    '2024-12-28T15:00:00Z',
    '2024-12-28T15:00:00Z',
    'dispatch@ridgeplumbing.example.com'
  ),
  (
    'd0d1f5a4-905b-4d45-bf32-b5e180527130',
    'c7bb2a6f-862a-4e44-9a6f-37f095bf6be9',
    'Red River Propane Services',
    'https://redriverpropane.example.com',
    'Shreveport, LA',
    'Seven-year propane service focused on seasonal deliveries and safety checks. Tessa keeps on-call rotation small to stay hands-on.',
    array['type:business-profile','industry:propane','years_operating:7','team_size:4','owner_role:Owner-Operator'],
    'active',
    '2024-12-28T16:00:00Z',
    '2024-12-28T16:00:00Z',
    'service@redriverpropane.example.com'
  )
on conflict (id) do nothing;

-- Leads / clients (jobs and prospects tied to owners)
insert into public.leads (
  id,
  owner_id,
  name,
  website,
  location,
  notes,
  tags,
  status,
  created_at,
  updated_at,
  email
) values
  (
    '64c8a2f0-4287-4dc9-9a7e-4ad59ad8054a',
    'a09f1b37-4d15-4c9b-b2e7-d2ca8ea050e1',
    'Beacon Hill Community Center HVAC refresh',
    null,
    'Tacoma, WA',
    'Job: refresh aging rooftop units; add variable-speed blowers in gym. Estimated value ~$6.5k. Last contact: facilities manager on 2025-01-03 (wants phased schedule).',
    array['type:client','source:referral','job:hvac-upgrade','estimated_value:6500','status:active'],
    'active',
    '2025-01-02T17:30:00Z',
    '2025-01-03T15:15:00Z',
    null
  ),
  (
    '6bd8789e-9095-4c07-847f-024b65d15e96',
    'a09f1b37-4d15-4c9b-b2e7-d2ca8ea050e1',
    'North Slope Rentals mini-splits',
    null,
    'Tacoma, WA',
    'Job: four-unit mini-split install for turnover timeline. Estimated value ~$18k. Last contact 2025-01-02; waiting on landlord to confirm electrical panel clearance.',
    array['type:client','source:website','job:mini-split','estimated_value:18000','status:follow-up'],
    'follow_up',
    '2025-01-01T18:45:00Z',
    '2025-01-02T21:10:00Z',
    null
  ),
  (
    'd21a1c18-8cff-4bfb-b5b4-c27c1e38f1eb',
    'b1a055b6-ace9-4dd9-8c4c-731aad6b72e8',
    'Maple & 7th triplex re-pipe',
    null,
    'Boise, ID',
    'Job: replace brittle galvanized lines before spring rentals. Estimated value ~$14k. Last contact 2025-01-03; owner wants updated permit steps.',
    array['type:client','source:referral','job:repipe','estimated_value:14000','status:follow-up'],
    'follow_up',
    '2024-12-30T16:20:00Z',
    '2025-01-03T02:10:00Z',
    null
  ),
  (
    'e8c3c980-61bb-4f43-b893-6fd04e76d1fb',
    'b1a055b6-ace9-4dd9-8c4c-731aad6b72e8',
    'Ada County Fairgrounds concessions drainage',
    null,
    'Boise, ID',
    'Job: upgrade concession drains before summer schedule. Estimated value ~$9k. Last contact 2024-12-27; county review stalled pending load calculations.',
    array['type:client','source:municipal','job:drainage','estimated_value:9000','status:stalled'],
    'stalled',
    '2024-12-20T21:10:00Z',
    '2024-12-27T18:00:00Z',
    null
  ),
  (
    '57733b6c-0d63-4678-a1c4-5189b25e6d78',
    'c7bb2a6f-862a-4e44-9a6f-37f095bf6be9',
    'Bayou Ridge Campground propane safety check',
    null,
    'Shreveport, LA',
    'Job: seasonal tank inspections plus refill schedule. Estimated value ~$5.2k. Last contact 2025-01-04; camp director asked for clearer drop window.',
    array['type:client','source:referral','job:safety-check','estimated_value:5200','status:active'],
    'active',
    '2025-01-03T12:05:00Z',
    '2025-01-04T09:50:00Z',
    null
  )
on conflict (id) do nothing;

-- Follow-ups (mixed overdue, upcoming, and completed)
insert into public.followups (
  id,
  lead_id,
  created_at,
  due_at,
  note,
  done,
  updated_at,
  completed_at
) values
  (
    '41d42d62-3a8b-4efd-8549-7fb9cf37d805',
    '64c8a2f0-4287-4dc9-9a7e-4ad59ad8054a',
    '2025-01-03T15:20:00Z',
    '2025-01-06T17:00:00Z',
    'Call facilities manager with phased install option and parts lead time.',
    false,
    '2025-01-03T15:20:00Z',
    null
  ),
  (
    '6659fb1c-2d91-48f8-9c0a-6b006430fa5f',
    '6bd8789e-9095-4c07-847f-024b65d15e96',
    '2025-01-02T21:15:00Z',
    '2025-01-04T15:00:00Z',
    'Send trimmed bid with staged install dates once panel clearance arrives.',
    false,
    '2025-01-02T21:15:00Z',
    null
  ),
  (
    '79ff2be8-4a4c-4d41-9fc8-231645114fb6',
    'd21a1c18-8cff-4bfb-b5b4-c27c1e38f1eb',
    '2025-01-03T02:15:00Z',
    '2025-01-03T19:30:00Z',
    'Email permit steps and reassure about drywall patch sequencing.',
    true,
    '2025-01-03T19:10:00Z',
    '2025-01-03T19:10:00Z'
  ),
  (
    '0c86d5ec-0f0b-4759-91b2-977c2a46f0c1',
    'e8c3c980-61bb-4f43-b893-6fd04e76d1fb',
    '2024-12-27T18:05:00Z',
    '2024-12-28T16:00:00Z',
    'Follow up with county reviewer on load calc note; log if no response.',
    false,
    '2024-12-27T18:05:00Z',
    null
  ),
  (
    'f0f5cedb-d70a-4e26-8f4d-7b63e839120d',
    '57733b6c-0d63-4678-a1c4-5189b25e6d78',
    '2025-01-04T10:00:00Z',
    '2025-01-05T14:00:00Z',
    'Confirm delivery window with camp director; share two-hour heads-up plan.',
    false,
    '2025-01-04T10:00:00Z',
    null
  )
on conflict (id) do nothing;

-- 2nd Look / analysis snapshots (observational, non-judgmental)
insert into public.lead_snapshots (
  id,
  lead_id,
  created_at,
  source_urls,
  summary,
  extracted_json,
  tokens_estimate
) values
  (
    '1bd59e1c-97ec-4e34-aead-bae88f23b0ff',
    'bbcb9241-779a-4d79-a455-3ad43d0e3c29',
    '2025-01-02T15:20:00Z',
    array['internal'],
    'Scheduling still routes through Marisol; techs hold until she confirms parts and timing.',
    jsonb_build_object(
      'signal_type', 'responsibility_bottleneck',
      'observation', 'Owner is the only one sequencing jobs and parts, causing idle gaps.',
      'impact_level', 'medium'
    ),
    180
  ),
  (
    '374b8616-2e4c-4f45-b77c-745ae8dc9508',
    'bbcb9241-779a-4d79-a455-3ad43d0e3c29',
    '2025-01-04T09:05:00Z',
    array['internal'],
    'Estimates slip when Marisol is onsite; no shared view of which bids are waiting on client approvals.',
    jsonb_build_object(
      'signal_type', 'decision_overload',
      'observation', 'Owner keeps bids in notebooks and email threads; field lead cannot progress without her.',
      'impact_level', 'high'
    ),
    200
  ),
  (
    '5d2efec3-6bc8-45ab-8c4b-3c5f21a4179d',
    '7c2c132d-5e8e-4f7d-a447-6e7c09b0e6d5',
    '2025-01-02T16:40:00Z',
    array['internal'],
    'Crew schedule depends on Darius estimating after hours; paperwork piles until weekend.',
    jsonb_build_object(
      'signal_type', 'scheduling_strain',
      'observation', 'No one else prices municipal work; permits and materials stay in Darius’ truck until Friday.',
      'impact_level', 'medium'
    ),
    170
  ),
  (
    '7a45a691-4f89-41c7-9f8f-2d8bc9737e8b',
    '7c2c132d-5e8e-4f7d-a447-6e7c09b0e6d5',
    '2025-01-04T11:10:00Z',
    array['internal'],
    'Cash from small residential jobs bridges larger municipal invoices; tight when inspections slip.',
    jsonb_build_object(
      'signal_type', 'cashflow_timing_pressure',
      'observation', 'Checks arrive unevenly; supplier bills are auto-drafted mid-month.',
      'impact_level', 'medium'
    ),
    160
  ),
  (
    'a96e1c7f-c726-4a34-a687-3b4a2110df11',
    'd0d1f5a4-905b-4d45-bf32-b5e180527130',
    '2025-01-03T13:55:00Z',
    array['internal'],
    'Tessa fields after-hours leak calls herself; rotation is light and creates next-day fatigue.',
    jsonb_build_object(
      'signal_type', 'responsibility_bottleneck',
      'observation', 'On-call is informal; safety decisions default to owner even when crew is available.',
      'impact_level', 'high'
    ),
    175
  )
on conflict (id) do nothing;
