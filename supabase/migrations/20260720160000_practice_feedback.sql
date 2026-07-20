-- Smiling Monad practice feedback and issue management.
-- Supports recommendations, complaints, positive feedback and development issues.
-- Does not change Kimi, the Companion gateway, tool selection or execution.

create table if not exists public.practice_feedback (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid
    references auth.users(id)
    on delete set null,

  feedback_type text not null
    check (
      feedback_type in (
        'recommendation',
        'complaint',
        'positive-feedback',
        'bug',
        'other'
      )
    ),

  title text not null
    check (
      char_length(trim(title)) between 3 and 160
    ),

  details text not null
    check (
      char_length(trim(details)) between 10 and 10000
    ),

  area text not null default 'general',

  urgency text not null default 'normal'
    check (
      urgency in (
        'low',
        'normal',
        'high',
        'urgent'
      )
    ),

  status text not null default 'new'
    check (
      status in (
        'new',
        'acknowledged',
        'investigating',
        'actioned',
        'resolved',
        'closed'
      )
    ),

  admin_notes text not null default '',
  resolution text not null default '',

  assigned_to uuid
    references auth.users(id)
    on delete set null,

  acknowledged_at timestamptz,
  resolved_at timestamptz,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

create index if not exists
  practice_feedback_user_id_idx
on public.practice_feedback(user_id);

create index if not exists
  practice_feedback_status_idx
on public.practice_feedback(status);

create index if not exists
  practice_feedback_type_idx
on public.practice_feedback(feedback_type);

create index if not exists
  practice_feedback_created_at_idx
on public.practice_feedback(created_at desc);

drop trigger if exists
  set_practice_feedback_updated_at
  on public.practice_feedback;

create trigger set_practice_feedback_updated_at
before update on public.practice_feedback
for each row
execute function public.set_updated_at();

alter table public.practice_feedback
enable row level security;

drop policy if exists
  "Users can submit practice feedback"
  on public.practice_feedback;

create policy
  "Users can submit practice feedback"
on public.practice_feedback
for insert
to authenticated
with check (
  user_id = auth.uid()
);

drop policy if exists
  "Users can read their own practice feedback"
  on public.practice_feedback;

create policy
  "Users can read their own practice feedback"
on public.practice_feedback
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_smiling_monad_admin()
);

drop policy if exists
  "Administrators can manage practice feedback"
  on public.practice_feedback;

create policy
  "Administrators can manage practice feedback"
on public.practice_feedback
for update
to authenticated
using (
  public.is_smiling_monad_admin()
)
with check (
  public.is_smiling_monad_admin()
);

drop policy if exists
  "Administrators can delete practice feedback"
  on public.practice_feedback;

create policy
  "Administrators can delete practice feedback"
on public.practice_feedback
for delete
to authenticated
using (
  public.is_smiling_monad_admin()
);

create or replace function public.sm_admin_feedback_summary()
returns table (
  total_items bigint,
  new_items bigint,
  complaints bigint,
  recommendations bigint,
  positive_feedback bigint,
  bugs bigint,
  urgent_items bigint,
  unresolved_items bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)::bigint as total_items,
    count(*) filter (
      where status = 'new'
    )::bigint as new_items,
    count(*) filter (
      where feedback_type = 'complaint'
    )::bigint as complaints,
    count(*) filter (
      where feedback_type = 'recommendation'
    )::bigint as recommendations,
    count(*) filter (
      where feedback_type = 'positive-feedback'
    )::bigint as positive_feedback,
    count(*) filter (
      where feedback_type = 'bug'
    )::bigint as bugs,
    count(*) filter (
      where urgency = 'urgent'
    )::bigint as urgent_items,
    count(*) filter (
      where status not in (
        'resolved',
        'closed'
      )
    )::bigint as unresolved_items
  from public.practice_feedback
  where public.is_smiling_monad_admin();
$$;

revoke all
on function public.sm_admin_feedback_summary()
from public;

grant execute
on function public.sm_admin_feedback_summary()
to authenticated;