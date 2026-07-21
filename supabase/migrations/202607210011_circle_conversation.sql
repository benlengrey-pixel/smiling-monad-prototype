-- ============================================================
-- SMILING MONAD
-- Migration 011 — Circle conversation
--
-- Creates a shared conversation for active Circle members.
-- Only the Circle creator and active members can read messages.
-- Only the signed-in sender can create their own message.
-- ============================================================

begin;

create table if not exists public.circle_messages (
  id uuid primary key default gen_random_uuid(),

  circle_id uuid not null
    references public.circles(id)
    on delete restrict,

  sender_user_id uuid not null
    references auth.users(id)
    on delete restrict,

  sender_name text not null default '',

  message_text text not null,

  created_at timestamptz not null default now(),

  edited_at timestamptz,
  deleted_at timestamptz,

  constraint circle_message_text_required
    check (
      length(trim(message_text)) > 0
    ),

  constraint circle_message_length_valid
    check (
      length(message_text) <= 5000
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
  "Circle members read messages"
on public.circle_messages;

drop policy if exists
  "Circle members send messages"
on public.circle_messages;

drop policy if exists
  "Senders update messages"
on public.circle_messages;

create policy
  "Circle members read messages"
on public.circle_messages
for select
to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_is_active_circle_member(circle_id)
);

create policy
  "Circle members send messages"
on public.circle_messages
for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and (
    private.sm_is_circle_creator(circle_id)
    or private.sm_is_active_circle_member(circle_id)
  )
);

create policy
  "Senders update messages"
on public.circle_messages
for update
to authenticated
using (
  sender_user_id = auth.uid()
  and deleted_at is null
  and (
    private.sm_is_circle_creator(circle_id)
    or private.sm_is_active_circle_member(circle_id)
  )
)
with check (
  sender_user_id = auth.uid()
  and (
    private.sm_is_circle_creator(circle_id)
    or private.sm_is_active_circle_member(circle_id)
  )
);

grant select, insert, update
on public.circle_messages
to authenticated;

commit;