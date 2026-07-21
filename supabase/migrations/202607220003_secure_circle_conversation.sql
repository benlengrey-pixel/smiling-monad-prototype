-- ============================================================
-- SMILING MONAD
-- Secure Circle Conversation
--
-- Creates one shared text conversation for each Circle.
-- Only active Circle members may read or post messages.
-- Removed, suspended, declined or expired members lose access
-- immediately through the existing active-membership helper.
-- ============================================================

begin;

create table if not exists public.circle_messages (
  id uuid primary key default gen_random_uuid(),

  circle_id uuid not null
    references public.circles(id)
    on delete cascade,

  sender_user_id uuid not null
    references auth.users(id)
    on delete restrict,

  sender_name text not null,
  message_body text not null,

  message_status text not null default 'active'
    check (
      message_status in (
        'active',
        'archived'
      )
    ),

  created_at timestamptz not null default now(),
  archived_at timestamptz
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