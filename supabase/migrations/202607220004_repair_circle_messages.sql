-- ============================================================
-- SMILING MONAD
-- Repair existing circle_messages table
--
-- The table already existed, so CREATE TABLE IF NOT EXISTS did
-- not add the newer columns. This migration adds the missing
-- fields before recreating the secure policies.
-- ============================================================

begin;

alter table public.circle_messages
  add column if not exists sender_name text not null default '';

alter table public.circle_messages
  add column if not exists message_body text not null default '';

alter table public.circle_messages
  add column if not exists message_status text not null default 'active';

alter table public.circle_messages
  add column if not exists archived_at timestamptz;

alter table public.circle_messages
  drop constraint if exists circle_messages_message_status_check;

alter table public.circle_messages
  add constraint circle_messages_message_status_check
  check (
    message_status in (
      'active',
      'archived'
    )
  );

create index if not exists
  circle_messages_circle_created_idx
on public.circle_messages(
  circle_id,
  created_at
);

create index if not exists
  circle_messages_sender_idx
on public.circle_messages(
  sender_user_id
);

alter table public.circle_messages
  enable row level security;

drop policy if exists
  "Active Circle members read messages"
on public.circle_messages;

create policy
  "Active Circle members read messages"
on public.circle_messages
for select
to authenticated
using (
  message_status = 'active'
  and private.sm_is_active_circle_member(
    circle_id
  )
);

drop policy if exists
  "Active Circle members post messages"
on public.circle_messages;

create policy
  "Active Circle members post messages"
on public.circle_messages
for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and private.sm_is_active_circle_member(
    circle_id
  )
  and length(trim(sender_name)) > 0
  and length(trim(message_body)) > 0
  and length(message_body) <= 4000
  and message_status = 'active'
);

revoke all
on public.circle_messages
from anon;

grant select, insert
on public.circle_messages
to authenticated;

commit;