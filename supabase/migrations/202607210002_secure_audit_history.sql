-- ============================================================
-- SMILING MONAD
-- Migration 002 — Secure Audit History
--
-- Creates:
--   audit_events
--
-- Adds append-only audit history to:
--   participants
--   circles
--   circle_members
--   circle_permissions
--   participant_consents
-- ============================================================

begin;


-- ============================================================
-- 1. AUDIT EVENTS TABLE
-- ============================================================

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),

  circle_id uuid
    references public.circles(id)
    on delete restrict,

  participant_id uuid
    references public.participants(id)
    on delete restrict,

  actor_user_id uuid
    references auth.users(id)
    on delete restrict,

  action text not null
    check (
      action in (
        'insert',
        'update',
        'archive',
        'status_change',
        'permission_change',
        'membership_change',
        'consent_change'
      )
    ),

  entity_type text not null,
  entity_id uuid not null,

  changed_fields text[] not null
    default array[]::text[],

  event_summary text not null default '',
  request_id text not null default '',
  source text not null default 'database',

  created_at timestamptz not null default now()
);


create index if not exists
  audit_events_circle_id_idx
on public.audit_events(circle_id);


create index if not exists
  audit_events_participant_id_idx
on public.audit_events(participant_id);


create index if not exists
  audit_events_actor_user_id_idx
on public.audit_events(actor_user_id);


create index if not exists
  audit_events_entity_idx
on public.audit_events(
  entity_type,
  entity_id
);


create index if not exists
  audit_events_created_at_idx
on public.audit_events(created_at desc);


-- ============================================================
-- 2. AUDIT ACCESS HELPER
-- ============================================================

create or replace function private.sm_can_read_audit_event(
  requested_circle_id uuid,
  requested_participant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when requested_circle_id is not null then
        private.sm_is_circle_creator(
          requested_circle_id
        )
        or private.sm_has_circle_permission(
          requested_circle_id,
          'manage_circle'
        )

      when requested_participant_id is not null then
        private.sm_is_participant_creator(
          requested_participant_id
        )

      else false
    end;
$$;


revoke all
on function private.sm_can_read_audit_event(
  uuid,
  uuid
)
from public;


revoke all
on function private.sm_can_read_audit_event(
  uuid,
  uuid
)
from anon;


grant execute
on function private.sm_can_read_audit_event(
  uuid,
  uuid
)
to authenticated;


-- ============================================================
-- 3. GENERIC AUDIT TRIGGER FUNCTION
-- ============================================================

create or replace function private.sm_record_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  record_json jsonb;

  resolved_circle_id uuid;
  resolved_participant_id uuid;
  resolved_entity_id uuid;

  resolved_action text;
  resolved_summary text;

  changed_field_names text[];
  request_headers jsonb;
begin
  record_json :=
    case
      when tg_op = 'DELETE'
        then to_jsonb(old)
      else to_jsonb(new)
    end;

  resolved_entity_id :=
    (record_json ->> 'id')::uuid;


  if tg_table_name = 'participants' then
    resolved_participant_id :=
      resolved_entity_id;


  elsif tg_table_name = 'circles' then
    resolved_circle_id :=
      resolved_entity_id;

    resolved_participant_id :=
      (record_json ->> 'participant_id')::uuid;


  elsif tg_table_name = 'circle_members' then
    resolved_circle_id :=
      (record_json ->> 'circle_id')::uuid;

    select circle_record.participant_id
    into resolved_participant_id
    from public.circles circle_record
    where circle_record.id =
      resolved_circle_id;


  elsif tg_table_name = 'circle_permissions' then
    select
      member.circle_id,
      circle_record.participant_id
    into
      resolved_circle_id,
      resolved_participant_id
    from public.circle_members member
    join public.circles circle_record
      on circle_record.id =
        member.circle_id
    where member.id =
      (record_json ->> 'circle_member_id')::uuid;


  elsif tg_table_name =
    'participant_consents'
  then
    resolved_circle_id :=
      (record_json ->> 'circle_id')::uuid;

    resolved_participant_id :=
      (record_json ->> 'participant_id')::uuid;
  end if;


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


  else
    changed_field_names :=
      array[]::text[];
  end if;


  resolved_action :=
    case
      when tg_table_name =
        'circle_permissions'
        then 'permission_change'

      when tg_table_name =
        'circle_members'
        then 'membership_change'

      when tg_table_name =
        'participant_consents'
        then 'consent_change'

      when tg_op = 'INSERT'
        then 'insert'

      when tg_op = 'UPDATE'
        and (
          'status' =
            any(changed_field_names)
          or 'membership_status' =
            any(changed_field_names)
          or 'consent_status' =
            any(changed_field_names)
        )
        then 'status_change'

      else 'update'
    end;


  resolved_summary :=
    case tg_table_name
      when 'participants'
        then 'Participant record changed'

      when 'circles'
        then 'Circle record changed'

      when 'circle_members'
        then 'Circle membership changed'

      when 'circle_permissions'
        then 'Circle permissions changed'

      when 'participant_consents'
        then 'Participant consent changed'

      else 'Smiling Monad record changed'
    end;


  begin
    request_headers :=
      nullif(
        current_setting(
          'request.headers',
          true
        ),
        ''
      )::jsonb;

  exception
    when others then
      request_headers := null;
  end;


  insert into public.audit_events (
    circle_id,
    participant_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    changed_fields,
    event_summary,
    request_id,
    source
  )
  values (
    resolved_circle_id,
    resolved_participant_id,
    auth.uid(),
    resolved_action,
    tg_table_name,
    resolved_entity_id,
    changed_field_names,
    resolved_summary,
    coalesce(
      request_headers ->> 'x-request-id',
      ''
    ),
    'database'
  );


  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;


revoke all
on function private.sm_record_audit_event()
from public;


revoke all
on function private.sm_record_audit_event()
from anon;


-- ============================================================
-- 4. AUDIT TRIGGERS
-- ============================================================

drop trigger if exists
  participants_record_audit
on public.participants;

create trigger participants_record_audit
after insert or update
on public.participants
for each row
execute function private.sm_record_audit_event();


drop trigger if exists
  circles_record_audit
on public.circles;

create trigger circles_record_audit
after insert or update
on public.circles
for each row
execute function private.sm_record_audit_event();


drop trigger if exists
  circle_members_record_audit
on public.circle_members;

create trigger circle_members_record_audit
after insert or update
on public.circle_members
for each row
execute function private.sm_record_audit_event();


drop trigger if exists
  circle_permissions_record_audit
on public.circle_permissions;

create trigger circle_permissions_record_audit
after insert or update
on public.circle_permissions
for each row
execute function private.sm_record_audit_event();


drop trigger if exists
  participant_consents_record_audit
on public.participant_consents;

create trigger participant_consents_record_audit
after insert or update
on public.participant_consents
for each row
execute function private.sm_record_audit_event();


-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

alter table public.audit_events
  enable row level security;


drop policy if exists
  "Authorised Circle managers read audit history"
on public.audit_events;


create policy
  "Authorised Circle managers read audit history"
on public.audit_events
for select
to authenticated
using (
  private.sm_can_read_audit_event(
    circle_id,
    participant_id
  )
);


-- ============================================================
-- 6. APP PRIVILEGES
-- ============================================================

revoke all
on public.audit_events
from anon;


revoke all
on public.audit_events
from authenticated;


grant select
on public.audit_events
to authenticated;


-- ============================================================
-- 7. APPEND-ONLY PROTECTION
-- ============================================================

create or replace function private.sm_block_audit_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception
    'Audit events are append-only and cannot be changed or deleted';
end;
$$;


revoke all
on function private.sm_block_audit_mutation()
from public;


revoke all
on function private.sm_block_audit_mutation()
from anon;


drop trigger if exists
  audit_events_block_update
on public.audit_events;

create trigger audit_events_block_update
before update
on public.audit_events
for each row
execute function private.sm_block_audit_mutation();


drop trigger if exists
  audit_events_block_delete
on public.audit_events;

create trigger audit_events_block_delete
before delete
on public.audit_events
for each row
execute function private.sm_block_audit_mutation();


commit;