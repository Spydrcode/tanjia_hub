import { DEMO_WORKSPACE_ID } from '@/src/lib/workspaces/constants';

// Deterministic demo fixtures for Phase 0 reset. owner_id fields are placeholders
// and will be overwritten to the calling user in the reset route.

export const DEMO_OWNER_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

export const DEMO_FIXTURES = {
  networking_groups: [
    { id: '30000000-0000-0000-0000-000000000001', owner_id: DEMO_OWNER_PLACEHOLDER, name: 'Founders Breakfast', description: 'Monthly local founders breakfast', workspace_id: DEMO_WORKSPACE_ID },
    { id: '30000000-0000-0000-0000-000000000002', owner_id: DEMO_OWNER_PLACEHOLDER, name: 'Product People', description: 'Product-focused peer group', workspace_id: DEMO_WORKSPACE_ID },
    { id: '30000000-0000-0000-0000-000000000003', owner_id: DEMO_OWNER_PLACEHOLDER, name: 'Design Circle', description: 'Design critique circle', workspace_id: DEMO_WORKSPACE_ID },
  ],

  leads: [
    { id: '20000000-0000-0000-0000-000000000001', owner_id: DEMO_OWNER_PLACEHOLDER, name: 'Quiet Studio', website: 'https://quiet.studio', notes: 'Demo lead: Quiet Studio.', status: 'new', workspace_id: DEMO_WORKSPACE_ID, created_at: '2024-09-01T12:00:00Z', updated_at: '2024-09-12T12:00:00Z' },
    { id: '20000000-0000-0000-0000-000000000002', owner_id: DEMO_OWNER_PLACEHOLDER, name: 'North Labs', website: 'https://north.example', notes: 'Interested in consulting.', status: 'contacted', workspace_id: DEMO_WORKSPACE_ID },
    { id: '20000000-0000-0000-0000-000000000003', owner_id: DEMO_OWNER_PLACEHOLDER, name: 'Paper & Co', website: 'https://paper.co', notes: '', status: 'lead', workspace_id: DEMO_WORKSPACE_ID },
    { id: '20000000-0000-0000-0000-000000000004', owner_id: DEMO_OWNER_PLACEHOLDER, name: 'Acme Retail', website: 'https://acme.example', notes: 'Large retail brand', status: 'opportunity', workspace_id: DEMO_WORKSPACE_ID },
    { id: '20000000-0000-0000-0000-000000000005', owner_id: DEMO_OWNER_PLACEHOLDER, name: 'Green Homes', website: 'https://green.example', notes: 'Sustainable housing', status: 'new', workspace_id: DEMO_WORKSPACE_ID },
    { id: '20000000-0000-0000-0000-000000000006', owner_id: DEMO_OWNER_PLACEHOLDER, name: 'Blue Metrics', website: 'https://blue.example', notes: 'Analytics startup', status: 'contacted', workspace_id: DEMO_WORKSPACE_ID },
  ],

  lead_snapshots: [
    { id: '21000000-0000-0000-0000-000000000001', lead_id: '20000000-0000-0000-0000-000000000001', workspace_id: DEMO_WORKSPACE_ID, summary: 'Quiet Studio summary', extracted_json: {}, created_at: '2024-09-12T12:05:00Z' },
    { id: '21000000-0000-0000-0000-000000000002', lead_id: '20000000-0000-0000-0000-000000000002', workspace_id: DEMO_WORKSPACE_ID, summary: 'North Labs snapshot', extracted_json: {}, created_at: '2024-09-10T11:00:00Z' },
  ],

  lead_analyses: [
    { id: '22000000-0000-0000-0000-000000000001', lead_id: '20000000-0000-0000-0000-000000000001', owner_id: DEMO_OWNER_PLACEHOLDER, workspace_id: DEMO_WORKSPACE_ID, analysis: 'Analysis 1', created_at: '2024-09-12T12:10:00Z' },
  ],

  followups: [
    { id: '24000000-0000-0000-0000-000000000001', lead_id: '20000000-0000-0000-0000-000000000001', note: 'Send brief homepage notes.', due_at: '2024-09-15T15:00:00Z', done: false, workspace_id: DEMO_WORKSPACE_ID, created_at: '2024-09-10T12:00:00Z' },
    { id: '24000000-0000-0000-0000-000000000002', lead_id: '20000000-0000-0000-0000-000000000002', note: 'Follow up about timeline.', due_at: '2024-09-16T10:00:00Z', done: false, workspace_id: DEMO_WORKSPACE_ID },
    { id: '24000000-0000-0000-0000-000000000003', lead_id: '20000000-0000-0000-0000-000000000003', note: 'Share pricing sheet.', due_at: '2024-09-18T09:00:00Z', done: false, workspace_id: DEMO_WORKSPACE_ID },
    { id: '24000000-0000-0000-0000-000000000004', lead_id: '20000000-0000-0000-0000-000000000004', note: 'Confirm stakeholder list.', due_at: '2024-09-12T09:00:00Z', done: true, workspace_id: DEMO_WORKSPACE_ID },
    { id: '24000000-0000-0000-0000-000000000005', lead_id: '20000000-0000-0000-0000-000000000005', note: 'Ask about sustainability goals.', due_at: '2024-09-13T11:00:00Z', done: false, workspace_id: DEMO_WORKSPACE_ID },
    { id: '24000000-0000-0000-0000-000000000006', lead_id: '20000000-0000-0000-0000-000000000006', note: 'Send intro deck.', due_at: '2024-09-14T14:00:00Z', done: false, workspace_id: DEMO_WORKSPACE_ID },
    { id: '24000000-0000-0000-0000-000000000007', lead_id: '20000000-0000-0000-0000-000000000001', note: 'Check scheduling availability.', due_at: '2024-09-16T16:00:00Z', done: false, workspace_id: DEMO_WORKSPACE_ID },
    { id: '24000000-0000-0000-0000-000000000008', lead_id: '20000000-0000-0000-0000-000000000002', note: 'Send contract sample.', due_at: '2024-09-20T10:00:00Z', done: false, workspace_id: DEMO_WORKSPACE_ID },
  ],

  meetings: [
    { id: '25000000-0000-0000-0000-000000000001', owner_id: DEMO_OWNER_PLACEHOLDER, title: 'Quiet Studio Intro', group_name: 'Founders Breakfast', start_at: '2025-01-10T10:00:00Z', status: 'planned', workspace_id: DEMO_WORKSPACE_ID },
    { id: '25000000-0000-0000-0000-000000000002', owner_id: DEMO_OWNER_PLACEHOLDER, title: 'North Labs Review', group_name: null, start_at: '2024-12-01T14:00:00Z', status: 'completed', workspace_id: DEMO_WORKSPACE_ID, completed_at: '2024-12-01T15:00:00Z' },
    { id: '25000000-0000-0000-0000-000000000003', owner_id: DEMO_OWNER_PLACEHOLDER, title: 'Paper & Co Sync', group_name: 'Product People', start_at: '2025-01-12T09:00:00Z', status: 'planned', workspace_id: DEMO_WORKSPACE_ID },
    { id: '25000000-0000-0000-0000-000000000004', owner_id: DEMO_OWNER_PLACEHOLDER, title: 'Acme Debrief', group_name: null, start_at: '2024-11-20T11:00:00Z', status: 'completed', workspace_id: DEMO_WORKSPACE_ID },
  ],

  meeting_interactions: [
    { id: '26000000-0000-0000-0000-000000000001', meeting_id: '25000000-0000-0000-0000-000000000001', person_name: 'A. Founder', company_name: 'Quiet Studio', role: 'Founder', notes: 'Interested in slow releases', followup_priority: 'warm', lead_id: '20000000-0000-0000-0000-000000000001', owner_id: DEMO_OWNER_PLACEHOLDER, workspace_id: DEMO_WORKSPACE_ID },
    { id: '26000000-0000-0000-0000-000000000002', meeting_id: '25000000-0000-0000-0000-000000000002', person_name: 'B. Lead', company_name: 'North Labs', role: 'CTO', notes: 'Need timeline', followup_priority: 'hot', lead_id: '20000000-0000-0000-0000-000000000002', owner_id: DEMO_OWNER_PLACEHOLDER, workspace_id: DEMO_WORKSPACE_ID },
    { id: '26000000-0000-0000-0000-000000000003', meeting_id: '25000000-0000-0000-0000-000000000003', person_name: 'C. Designer', company_name: 'Paper & Co', role: 'Design Lead', notes: '', followup_priority: 'warm', lead_id: null, owner_id: DEMO_OWNER_PLACEHOLDER, workspace_id: DEMO_WORKSPACE_ID },
    { id: '26000000-0000-0000-0000-000000000004', meeting_id: '25000000-0000-0000-0000-000000000004', person_name: 'D. Manager', company_name: 'Acme Retail', role: 'PM', notes: 'Budget constraints', followup_priority: 'cold', lead_id: '20000000-0000-0000-0000-000000000004', owner_id: DEMO_OWNER_PLACEHOLDER, workspace_id: DEMO_WORKSPACE_ID },
    { id: '26000000-0000-0000-0000-000000000005', meeting_id: '25000000-0000-0000-0000-000000000001', person_name: 'E. Producer', company_name: 'Quiet Studio', role: 'Producer', notes: '', followup_priority: 'warm', lead_id: null, owner_id: DEMO_OWNER_PLACEHOLDER, workspace_id: DEMO_WORKSPACE_ID },
    { id: '26000000-0000-0000-0000-000000000006', meeting_id: '25000000-0000-0000-0000-000000000002', person_name: 'F. Eng', company_name: 'North Labs', role: 'Engineer', notes: '', followup_priority: 'warm', lead_id: null, owner_id: DEMO_OWNER_PLACEHOLDER, workspace_id: DEMO_WORKSPACE_ID },
    { id: '26000000-0000-0000-0000-000000000007', meeting_id: '25000000-0000-0000-0000-000000000003', person_name: 'G. Designer', company_name: 'Paper & Co', role: 'Designer', notes: '', followup_priority: 'warm', lead_id: null, owner_id: DEMO_OWNER_PLACEHOLDER, workspace_id: DEMO_WORKSPACE_ID },
    { id: '26000000-0000-0000-0000-000000000008', meeting_id: '25000000-0000-0000-0000-000000000004', person_name: 'H. Ops', company_name: 'Acme Retail', role: 'Ops', notes: '', followup_priority: 'cold', lead_id: null, owner_id: DEMO_OWNER_PLACEHOLDER, workspace_id: DEMO_WORKSPACE_ID },
  ],

  lead_bookings: [
    { id: '27000000-0000-0000-0000-000000000001', lead_name: 'Quiet Studio', company: 'Quiet Studio', status: 'confirmed', owner_id: DEMO_OWNER_PLACEHOLDER, workspace_id: DEMO_WORKSPACE_ID, created_at: '2024-09-11T10:00:00Z' },
    { id: '27000000-0000-0000-0000-000000000002', lead_name: 'North Labs', company: 'North Labs', status: 'pending', owner_id: DEMO_OWNER_PLACEHOLDER, workspace_id: DEMO_WORKSPACE_ID, created_at: '2024-09-09T09:00:00Z' },
  ],

  messages: [
    { id: '28000000-0000-0000-0000-000000000001', lead_id: '20000000-0000-0000-0000-000000000001', owner_id: DEMO_OWNER_PLACEHOLDER, channel: 'email', intent: 'followup', body: 'Thanks—here are a few notes.', is_sent: true, message_type: 'outbound', workspace_id: DEMO_WORKSPACE_ID, created_at: '2024-09-12T12:20:00Z' },
    { id: '28000000-0000-0000-0000-000000000002', lead_id: '20000000-0000-0000-0000-000000000002', owner_id: DEMO_OWNER_PLACEHOLDER, channel: 'dm', intent: 'intro', body: 'Nice to meet you!', is_sent: false, message_type: 'draft', workspace_id: DEMO_WORKSPACE_ID },
    { id: '28000000-0000-0000-0000-000000000003', lead_id: null, owner_id: DEMO_OWNER_PLACEHOLDER, channel: 'system', intent: 'note', body: 'System note about demo', is_sent: false, message_type: 'note', workspace_id: DEMO_WORKSPACE_ID },
    { id: '28000000-0000-0000-0000-000000000004', lead_id: '20000000-0000-0000-0000-000000000003', owner_id: DEMO_OWNER_PLACEHOLDER, channel: 'email', intent: 'intro', body: 'Intro email.', is_sent: true, message_type: 'outbound', workspace_id: DEMO_WORKSPACE_ID },
    { id: '28000000-0000-0000-0000-000000000005', lead_id: '20000000-0000-0000-0000-000000000004', owner_id: DEMO_OWNER_PLACEHOLDER, channel: 'email', intent: 'proposal', body: 'Proposal attached.', is_sent: true, message_type: 'outbound', workspace_id: DEMO_WORKSPACE_ID },
    { id: '28000000-0000-0000-0000-000000000006', lead_id: '20000000-0000-0000-0000-000000000005', owner_id: DEMO_OWNER_PLACEHOLDER, channel: 'dm', intent: 'followup', body: 'Quick check-in.', is_sent: false, message_type: 'draft', workspace_id: DEMO_WORKSPACE_ID },
    { id: '28000000-0000-0000-0000-000000000007', lead_id: '20000000-0000-0000-0000-000000000006', owner_id: DEMO_OWNER_PLACEHOLDER, channel: 'email', intent: 'intro', body: 'Hello from demo.', is_sent: true, message_type: 'outbound', workspace_id: DEMO_WORKSPACE_ID },
    { id: '28000000-0000-0000-0000-000000000008', lead_id: null, owner_id: DEMO_OWNER_PLACEHOLDER, channel: 'system', intent: 'reminder', body: 'Reminder example', is_sent: false, message_type: 'note', workspace_id: DEMO_WORKSPACE_ID },
    { id: '28000000-0000-0000-0000-000000000009', lead_id: '20000000-0000-0000-0000-000000000001', owner_id: DEMO_OWNER_PLACEHOLDER, channel: 'email', intent: 'followup', body: 'A followup note.', is_sent: true, message_type: 'outbound', workspace_id: DEMO_WORKSPACE_ID },
    { id: '28000000-0000-0000-0000-000000000010', lead_id: '20000000-0000-0000-0000-000000000002', owner_id: DEMO_OWNER_PLACEHOLDER, channel: 'dm', intent: 'reply', body: 'Reply draft.', is_sent: false, message_type: 'draft', workspace_id: DEMO_WORKSPACE_ID },
  ],

  networking_drafts: [
    { id: '29000000-0000-0000-0000-000000000001', owner_id: DEMO_OWNER_PLACEHOLDER, title: 'Intro Draft', body: 'Hi, I wanted to reach out...', workspace_id: DEMO_WORKSPACE_ID },
    { id: '29000000-0000-0000-0000-000000000002', owner_id: DEMO_OWNER_PLACEHOLDER, title: 'Followup Draft', body: 'Following up on...', workspace_id: DEMO_WORKSPACE_ID },
    { id: '29000000-0000-0000-0000-000000000003', owner_id: DEMO_OWNER_PLACEHOLDER, title: 'Meeting Notes', body: 'Notes template...', workspace_id: DEMO_WORKSPACE_ID },
    { id: '29000000-0000-0000-0000-000000000004', owner_id: DEMO_OWNER_PLACEHOLDER, title: 'Quick Reply', body: 'Thanks for sharing...', workspace_id: DEMO_WORKSPACE_ID },
    { id: '29000000-0000-0000-0000-000000000005', owner_id: DEMO_OWNER_PLACEHOLDER, title: 'DM Draft', body: 'Short DM template', workspace_id: DEMO_WORKSPACE_ID },
    { id: '29000000-0000-0000-0000-000000000006', owner_id: DEMO_OWNER_PLACEHOLDER, title: 'Email Followup', body: 'Email followup template', workspace_id: DEMO_WORKSPACE_ID },
  ],

  referrals: [
    { id: '31000000-0000-0000-0000-000000000001', owner_id: DEMO_OWNER_PLACEHOLDER, from_lead_id: '20000000-0000-0000-0000-000000000001', to_lead_id: '20000000-0000-0000-0000-000000000002', note: 'Intro to CTO', workspace_id: DEMO_WORKSPACE_ID },
    { id: '31000000-0000-0000-0000-000000000002', owner_id: DEMO_OWNER_PLACEHOLDER, from_lead_id: '20000000-0000-0000-0000-000000000003', to_lead_id: '20000000-0000-0000-0000-000000000005', note: 'Referral for sustainability', workspace_id: DEMO_WORKSPACE_ID },
    { id: '31000000-0000-0000-0000-000000000003', owner_id: DEMO_OWNER_PLACEHOLDER, from_lead_id: '20000000-0000-0000-0000-000000000004', to_lead_id: '20000000-0000-0000-0000-000000000006', note: 'Referral', workspace_id: DEMO_WORKSPACE_ID },
    { id: '31000000-0000-0000-0000-000000000004', owner_id: DEMO_OWNER_PLACEHOLDER, from_lead_id: '20000000-0000-0000-0000-000000000002', to_lead_id: '20000000-0000-0000-0000-000000000003', note: 'Connect designer', workspace_id: DEMO_WORKSPACE_ID },
    { id: '31000000-0000-0000-0000-000000000005', owner_id: DEMO_OWNER_PLACEHOLDER, from_lead_id: '20000000-0000-0000-0000-000000000005', to_lead_id: '20000000-0000-0000-0000-000000000001', note: 'Follow-up intro', workspace_id: DEMO_WORKSPACE_ID },
  ],
};

export default DEMO_FIXTURES;
