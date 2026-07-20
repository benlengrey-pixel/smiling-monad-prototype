-- ============================================================
-- SMILING MONAD
-- Migration 006 — Secure Circle Goals
--
-- Creates:
--   circle_goals
--
-- Security:
--   • Circle membership and explicit goal permissions
--   • Row Level Security
--   • append-only audit history
--   • no app-level DELETE access
--   • goals are archived rather than deleted
-- ============================================================

begin;


-- ============================================================
-- 1. GOALS TABLE
-- ============================================================

create table if not exists public.circle_goals (
  id uuid primary key default gen_random_uuid(),

  circle_id uuid not null
    references public.circles(id)
    on delete restrict,

  participant_id uuid not null
    references public.participants(id)
    on delete restrict,

  title text not null,
  description text not null default '',
  desired_outcome text not null default '',

  category text not null default 'other'
    check (
      category in (
        'daily_living',
        'health',
        'communication',
        'relationships',
        'community',
        'education',
        'employment',
        'independence',
        'wellbeing',
        'other'
      )
    ),

  goal_status text not null default 'planning'
    check (
      goal_status in (
        'planning',
        'active',
        'paused',
        'achieved',
        'archived'
      )
    ),

  priority text not null default 'medium'
    check (
      priority in (
        'low',
        'medium',
        'high'
      )
    ),

  owner_name text not null default '',
  target_date date,

  progress_notes text not null default '',

  achieved_at timestamptz,
  archived_at timestamptz,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  updated_by uuid
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create index if not exists
  circle_goals_circle_id_idx
on public.circle_goals(circle_id);


create index if not exists
  circle_goals_participant_id_idx
on public.circle_goals(participant_id);


create index if not exists
  circle_goals_status_idx
on public.circle_goals(goal_status);


create index if not exists
  circle_goals_target_date_idx
on public.circle_goals(target_date);


create index if not exists
  circle_goals_created_by_idx
on public.circle_goals(created_by);


-- ============================================================
-- 2. UPDATED_AT TRIGGER
-- ============================================================

drop trigger if exists
  circle_goals_set_updated_at
on public.circle_goals;


create trigger circle_goals_set_updated_at
before update
on public.circle_goals
for each row
execute function private.sm_set_updated_at();


-- ============================================================
-- 3. VALIDATE GOAL RECORD
-- ============================================================

create or replace function private.sm_validate_circle_goal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(trim(new.title)) = 0 then
    raise exception
      'A goal title is required';
  end if;


  if not exists (
    select 1
    from public.circles circle_record
    where circle_record.id = new.circle_id
      and circle_record.participant_id =
        new.participant_id
  ) then
    raise exception
      'The selected Circle does not belong to this participant';
  end if;


  if new.goal_status = 'achieved'
    and new.achieved_at is null
  then
    new.achieved_at := now();
  end if;


  if new.goal_status <> 'achieved' then
    new.achieved_at := null;
  end if;


  if new.goal_status = 'archived'
    and new.archived_at is null
  then
    new.archived_at := now();
  end if;


  if new.goal_status <> 'archived' then
    new.archived_at := null;
  end if;


  return new;
end;
$$;


revoke all
on function private.sm_validate_circle_goal()
from public;


revoke all
on function private.sm_validate_circle_goal()
from anon;


drop trigger if exists
  circle_goals_validate_record
on public.circle_goals;


create trigger circle_goals_validate_record
before insert or update
on public.circle_goals
for each row
execute function private.sm_validate_circle_goal();


-- ============================================================
-- 4. PROTECT GOAL IDENTITY
-- ============================================================

create or replace function private.sm_protect_circle_goal_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.circle_id <> old.circle_id
    or new.participant_id <> old.participant_id
    or new.created_by <> old.created_by
  then
    raise exception
      'Goal identity cannot be changed';
  end if;

  return new;
end;
$$;


revoke all
on function private.sm_protect_circle_goal_identity()
from public;


revoke all
on function private.sm_protect_circle_goal_identity()
from anon;


drop trigger if exists
  circle_goals_protect_identity
on public.circle_goals;


create trigger circle_goals_protect_identity
before update
on public.circle_goals
for each row
execute function private.sm_protect_circle_goal_identity();


-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

alter table public.circle_goals
  enable row level security;


drop policy if exists
  "Authorised members read goals"
on public.circle_goals;


drop policy if exists
  "Authorised members create goals"
on public.circle_goals;


drop policy if exists
  "Authorised members update goals"
on public.circle_goals;


-- ============================================================
-- 6. READ POLICY
-- ============================================================

create policy
  "Authorised members read goals"
on public.circle_goals
for select
to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'view_goals'
  )
);


-- ============================================================
-- 7. CREATE POLICY
-- ============================================================

create policy
  "Authorised members create goals"
on public.circle_goals
for insert
to authenticated
with check (
  created_by = auth.uid()

  and (
    private.sm_is_circle_creator(circle_id)
    or private.sm_has_circle_permission(
      circle_id,
      'edit_goals'
    )
  )

  and exists (
    select 1
    from public.circles circle_record
    where circle_record.id =
      circle_goals.circle_id
      and circle_record.participant_id =
        circle_goals.participant_id
  )
);


-- ============================================================
-- 8. UPDATE POLICY
-- ============================================================

create policy
  "Authorised members update goals"
on public.circle_goals
for update
to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'edit_goals'
  )
)
with check (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'edit_goals'
  )
);


-- ============================================================
-- 9. GOAL AUDIT HISTORY
-- ============================================================

create or replace function private.sm_record_circle_goal_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_field_names text[];
  audit_action text;
begin
  if tg_op = 'INSERT' then
    select coalesce(
      array_agg(
        field_name
        order by field_name
      ),
      array[]::text[]
    )
    into changed_field_names
    from jsonb_object_keys(
      to_jsonb(new)
        - 'created_at'
        - 'updated_at'
    ) as field_name;

    audit_action := 'insert';


  elsif tg_op = 'UPDATE' then
    select coalesce(
      array_agg(
        field_name
        order by field_name
      ),
      array[]::text[]
    )
    into changed_field_names
    from (
      select
        new_fields.key as field_name
      from jsonb_each(
        to_jsonb(new) - 'updated_at'
      ) new_fields
      join jsonb_each(
        to_jsonb(old) - 'updated_at'
      ) old_fields
        on old_fields.key =
          new_fields.key
      where new_fields.value
        is distinct from old_fields.value
    ) changed;

    audit_action :=
      case
        when new.goal_status = 'archived'
          and old.goal_status <> 'archived'
          then 'archive'

        when new.goal_status <>
          old.goal_status
          then 'status_change'

        else 'update'
      end;
  end if;


  insert into public.audit_events (
    circle_id,
    participant_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    changed_fields,
    event_summary,
    source
  )
  values (
    new.circle_id,
    new.participant_id,
    auth.uid(),
    audit_action,
    'circle_goals',
    new.id,
    changed_field_names,
    'Circle goal changed',
    'database'
  );


  return new;
end;
$$;


revoke all
on function private.sm_record_circle_goal_audit()
from public;


revoke all
on function private.sm_record_circle_goal_audit()
from anon;


drop trigger if exists
  circle_goals_record_audit
on public.circle_goals;


create trigger circle_goals_record_audit
after insert or update
on public.circle_goals
for each row
execute function private.sm_record_circle_goal_audit();


-- ============================================================
-- 10. TABLE PRIVILEGES
--
-- No DELETE permission is granted.
-- Goals are archived using goal_status.
-- ============================================================

revoke all
on public.circle_goals
from anon;


revoke all
on public.circle_goals
from authenticated;


grant select, insert, update
on public.circle_goals
to authenticated;


commit;