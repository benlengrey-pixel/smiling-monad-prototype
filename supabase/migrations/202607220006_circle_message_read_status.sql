-- ============================================================
-- SMILING MONAD
-- Circle Message Read Status
--
-- Stores the last time each active Circle member viewed the
-- shared Circle conversation. This supports unread counts without
-- exposing message content or read history to other members.
-- ============================================================

begin;

create table if not exists public.circle_message_reads (
  circle_id uuid not null
    references public.circles(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  last_read_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (
    circle_id,
    user_id
  )
);

create index if not exists
  circle_message_reads_user_idx
on public.circle_message_reads(
  user_id
);

drop trigger if exists
  circle_message_reads_set_updated_at
on public.circle_message_reads;

create trigger circle_message_reads_set_updated_at
before update on public.circle_message_reads
for each row
execute function private.sm_set_updated_at();

alter table public.circle_message_reads
  enable row level security;

drop policy if exists
  "Members read their own Circle message status"
on public.circle_message_reads;

create policy
  "Members read their own Circle message status"
on public.circle_message_reads
for select
to authenticated
using (
  user_id = auth.uid()
  and private.sm_is_active_circle_member(
    circle_id
  )
);

drop policy if exists
  "Members create their own Circle message status"
on public.circle_message_reads;

create policy
  "Members create their own Circle message status"
on public.circle_message_reads
for insert
to authenticated
with check (
  user_id = auth.uid()
  and private.sm_is_active_circle_member(
    circle_id
  )
);

drop policy if exists
  "Members update their own Circle message status"
on public.circle_message_reads;

create policy
  "Members update their own Circle message status"
on public.circle_message_reads
for update
to authenticated
using (
  user_id = auth.uid()
  and private.sm_is_active_circle_member(
    circle_id
  )
)
with check (
  user_id = auth.uid()
  and private.sm_is_active_circle_member(
    circle_id
  )
);

revoke all
on public.circle_message_reads
from anon;

grant select, insert, update
on public.circle_message_reads
to authenticated;

commit;