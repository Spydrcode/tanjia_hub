-- Add recording and transcript fields to meetings
alter table public.meetings
  add column if not exists recording_url text,
  add column if not exists transcript_text text,
  add column if not exists transcript_source text;

-- Add index for faster queries on meetings with recordings
create index if not exists idx_meetings_recording_url on public.meetings(recording_url) where recording_url is not null;
