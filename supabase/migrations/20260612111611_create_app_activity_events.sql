-- Create app_activity_events table for tracking judge visit & usage anonymously
create table public.app_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  session_id text not null,
  mode text not null check (mode in ('logged_in', 'guest')),
  event_name text not null,
  page text null,
  feature text null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

-- Add indexes for common query fields on admin dashboard
create index idx_app_activity_events_user_id on public.app_activity_events(user_id);
create index idx_app_activity_events_session_id on public.app_activity_events(session_id);
create index idx_app_activity_events_event_name on public.app_activity_events(event_name);
create index idx_app_activity_events_created_at_desc on public.app_activity_events(created_at desc);
create index idx_app_activity_events_mode on public.app_activity_events(mode);

-- Enable Row Level Security (RLS)
alter table public.app_activity_events enable row level security;

-- Policies for public insertions:
-- 1. Authenticated users can insert their own events (where user_id matches auth.uid())
create policy "Allow authenticated users to insert their own events"
on public.app_activity_events
for insert
with check (
  auth.role() = 'authenticated' and (user_id = auth.uid())
);

-- 2. Guest/anon users can insert events with user_id null
create policy "Allow anon users to insert guest events"
on public.app_activity_events
for insert
with check (
  auth.role() = 'anon' and (user_id is null)
);

-- Note: No SELECT policies are defined. Normal clients cannot read the analytics events,
-- fulfilling the requirement that users cannot read analytics from client. Only server-side
-- queries using the service role bypass RLS and can fetch the events for the admin view.
