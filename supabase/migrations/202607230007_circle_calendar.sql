-- ============================================================
-- SMILING MONAD
-- Migration 007 — Secure Circle Calendar and Schedule Planner
--
-- Creates:
--   public.circle_schedule_events
--   public.circle_schedule_assignments
--
-- Supports:
--   • appointments, shifts, meetings, activities and deadlines
--   • month, week and agenda calendar views
--   • repeating schedule rules
--   • assigned Circle members
--   • locations, notes, reminders and status
--   • links to meetings, responsibilities and documents
--
-- Security:
--   • every event belongs to one Circle and participant
--   • Circle membership and permissions control access
--   • no delete permission is granted
--   • changes are recorded in secure audit history
-- ============================================================

begin;


-- ============================================================
-- 1. CIRCLE SCHEDULE EVENTS
-- ============================================================

create table if not exists
  public.circle_schedule_events (
    id uuid primary key
      default gen_random_uuid(),

    circle_id uuid not null
      references public.circles(id)
      on delete restrict,

    participant_id uuid not null
      references public.participants(id)
      on delete restrict,

    title text not null,

    event_type text not null
      default 'activity'
      check (
        event_type in (
          'appointment',
          'shift',
          'meeting',
          'activity',
          'deadline',
          'transport',
          'health',
          'personal',
          'other'
        )
      ),

    start_at timestamptz not null,
    end_at timestamptz not null,

    all_day boolean not null
      default false,

    timezone text not null
      default 'Australia/Sydney',

    location text not null
      default '',

    notes text not null
      default '',

    event_status text not null
      default 'planned'
      check (
        event_status in (
          'planned',
          'confirmed',
          'completed',
          'cancelled',
          'archived'
        )
      ),

    recurrence_rule text not null
      default '',

    recurrence_end_at timestamptz,

    reminder_minutes integer[] not null
      default array[60]::integer[],

    related_meeting_id uuid
      references public.circle_meetings(id)
      on delete set null,

    related_responsibility_id uuid
      references public.circle_responsibilities(id)
      on delete set null,

    related_document_id uuid
      references public.documents(id)
      on delete set null,

    created_by uuid not null
      references auth.users(id)
      on delete restrict,

    updated_by uuid
      references auth.users(id)
      on delete restrict,

    archived_at timestamptz,

    created_at timestamptz not null
      default now(),

    updated_at timestamptz not null
      default now(),

    constraint circle_schedule_event_times_valid
      check (end_at > start_at),

    constraint circle_schedule_recurrence_end_valid
      check (
        recurrence_end_at is null
        or recurrence_end_at >= start_at
      )
  );


create index if not exists
  circle_schedule_events_circle_id_idx
on public.circle_schedule_events(circle_id);


create index if not exists
  circle_schedule_events_participant_id_idx
on public.circle_schedule_events(participant_id);


create index if not exists
  circle_schedule_events_start_at_idx
on public.circle_schedule_events(start_at);


create index if not exists
  circle_schedule_events_end_at_idx
on public.circle_schedule_events(end_at);


create index if not exists
  circle_schedule_events_status_idx
on public.circle_schedule_events(event_status);


create index if not exists
  circle_schedule_events_type_idx
on public.circle_schedule_events(event_type);


drop trigger if exists
  circle_schedule_events_set_updated_at
on public.circle_schedule_events;


create trigger
  circle_schedule_events_set_updated_at
before update on public.circle_schedule_events
for each row
execute function private.sm_set_updated_at();


-- ============================================================
-- 2. EVENT ASSIGNMENTS
-- ============================================================

create table if not exists
  public.circle_schedule_assignments (
    id uuid primary key
      default gen_random_uuid(),

    circle_id uuid not null
      references public.circles(id)
      on delete restrict,

    participant_id uuid not null
      references public.participants(id)
      on delete restrict,

    event_id uuid not null
      references public.circle_schedule_events(id)
      on delete cascade,

    circle_member_id uuid not null
      references public.circle_members(id)
      on delete restrict,

    assignment_role text not null
      default 'attendee'
      check (
        assignment_role in (
          'lead',
          'attendee',
          'support',
          'transport',
          'other'
        )
      ),

    response_status text not null
      default 'pending'
      check (
        response_status in (
          'pending',
          'accepted',
          'tentative',
          'declined'
        )
      ),

    created_by uuid not null
      references auth.users(id)
      on delete restrict,

    updated_by uuid
      references auth.users(id)
      on delete restrict,

    created_at timestamptz not null
      default now(),

    updated_at timestamptz not null
      default now(),

    constraint
      circle_schedule_assignment_unique_member
      unique (
        event_id,
        circle_member_id
      )
  );


create index if not exists
  circle_schedule_assignments_circle_id_idx
on public.circle_schedule_assignments(circle_id);


create index if not exists
  circle_schedule_assignments_event_id_idx
on public.circle_schedule_assignments(event_id);


create index if not exists
  circle_schedule_assignments_member_id_idx
on public.circle_schedule_assignments(
  circle_member_id
);


drop trigger if exists
  circle_schedule_assignments_set_updated_at
on public.circle_schedule_assignments;


create trigger
  circle_schedule_assignments_set_updated_at
before update on public.circle_schedule_assignments
for each row
execute function private.sm_set_updated_at();


-- ============================================================
-- 3. EVENT VALIDATION
-- ============================================================

create or replace function
  private.sm_validate_circle_schedule_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.title := trim(new.title);
  new.location := trim(new.location);
  new.notes := trim(new.notes);
  new.timezone := trim(new.timezone);
  new.recurrence_rule :=
    trim(new.recurrence_rule);

  if length(new.title) = 0 then
    raise exception
      'A calendar event title is required';
  end if;

  if length(new.timezone) = 0 then
    raise exception
      'A calendar timezone is required';
  end if;

  if new.end_at <= new.start_at then
    raise exception
      'The calendar event must end after it starts';
  end if;

  if not exists (
    select 1
    from public.circles circle_record
    where circle_record.id = new.circle_id
      and circle_record.participant_id =
        new.participant_id
      and circle_record.status <> 'archived'
  ) then
    raise exception
      'The calendar event does not belong to this Circle and participant';
  end if;

  if new.related_meeting_id is not null
     and not exists (
       select 1
       from public.circle_meetings meeting
       where meeting.id =
           new.related_meeting_id
         and meeting.circle_id =
           new.circle_id
         and meeting.participant_id =
           new.participant_id
     )
  then
    raise exception
      'The linked meeting does not belong to this Circle';
  end if;

  if new.related_responsibility_id is not null
     and not exists (
       select 1
       from public.circle_responsibilities responsibility
       where responsibility.id =
           new.related_responsibility_id
         and responsibility.circle_id =
           new.circle_id
         and responsibility.participant_id =
           new.participant_id
     )
  then
    raise exception
      'The linked responsibility does not belong to this Circle';
  end if;

  if new.related_document_id is not null
     and not exists (
       select 1
       from public.documents document
       where document.id =
           new.related_document_id
         and document.circle_id =
           new.circle_id
         and document.participant_id =
           new.participant_id
     )
  then
    raise exception
      'The linked document does not belong to this Circle';
  end if;

  if new.event_status = 'archived'
     and new.archived_at is null
  then
    new.archived_at := now();
  elsif new.event_status <> 'archived' then
    new.archived_at := null;
  end if;

  if new.recurrence_rule = '' then
    new.recurrence_end_at := null;
  end if;

  return new;
end;
$$;


revoke all
on function
  private.sm_validate_circle_schedule_event()
from public, anon;


drop trigger if exists
  circle_schedule_events_validate
on public.circle_schedule_events;


create trigger
  circle_schedule_events_validate
before insert or update
on public.circle_schedule_events
for each row
execute function
  private.sm_validate_circle_schedule_event();


-- ============================================================
-- 4. ASSIGNMENT VALIDATION
-- ============================================================

create or replace function
  private.sm_validate_circle_schedule_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.circle_schedule_events event
    where event.id = new.event_id
      and event.circle_id = new.circle_id
      and event.participant_id =
        new.participant_id
      and event.event_status <> 'archived'
  ) then
    raise exception
      'The calendar assignment does not belong to this event';
  end if;

  if not exists (
    select 1
    from public.circle_members member
    where member.id =
        new.circle_member_id
      and member.circle_id =
        new.circle_id
      and member.membership_status in (
        'invited',
        'active'
      )
  ) then
    raise exception
      'The assigned person does not belong to this Circle';
  end if;

  return new;
end;
$$;


revoke all
on function
  private.sm_validate_circle_schedule_assignment()
from public, anon;


drop trigger if exists
  circle_schedule_assignments_validate
on public.circle_schedule_assignments;


create trigger
  circle_schedule_assignments_validate
before insert or update
on public.circle_schedule_assignments
for each row
execute function
  private.sm_validate_circle_schedule_assignment();


-- ============================================================
-- 5. ROW LEVEL SECURITY
--
-- Calendar access currently follows the Circle's existing
-- meeting permissions:
--   view_meetings   -> view the calendar
--   manage_meetings -> create and update the calendar
-- ============================================================

alter table public.circle_schedule_events
  enable row level security;


alter table public.circle_schedule_assignments
  enable row level security;


drop policy if exists
  "Authorised members read calendar events"
on public.circle_schedule_events;


drop policy if exists
  "Authorised members create calendar events"
on public.circle_schedule_events;


drop policy if exists
  "Authorised members update calendar events"
on public.circle_schedule_events;


create policy
  "Authorised members read calendar events"
on public.circle_schedule_events
for select
to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'view_meetings'
  )
);


create policy
  "Authorised members create calendar events"
on public.circle_schedule_events
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    private.sm_is_circle_creator(circle_id)
    or private.sm_has_circle_permission(
      circle_id,
      'manage_meetings'
    )
  )
);


create policy
  "Authorised members update calendar events"
on public.circle_schedule_events
for update
to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'manage_meetings'
  )
)
with check (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'manage_meetings'
  )
);


drop policy if exists
  "Authorised members read calendar assignments"
on public.circle_schedule_assignments;


drop policy if exists
  "Authorised members create calendar assignments"
on public.circle_schedule_assignments;


drop policy if exists
  "Authorised members update calendar assignments"
on public.circle_schedule_assignments;


create policy
  "Authorised members read calendar assignments"
on public.circle_schedule_assignments
for select
to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'view_meetings'
  )
);


create policy
  "Authorised members create calendar assignments"
on public.circle_schedule_assignments
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    private.sm_is_circle_creator(circle_id)
    or private.sm_has_circle_permission(
      circle_id,
      'manage_meetings'
    )
  )
);


create policy
  "Authorised members update calendar assignments"
on public.circle_schedule_assignments
for update
to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'manage_meetings'
  )
)
with check (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'manage_meetings'
  )
);


-- ============================================================
-- 6. AUDIT HISTORY
-- ============================================================

drop trigger if exists
  circle_schedule_events_record_audit
on public.circle_schedule_events;


create trigger
  circle_schedule_events_record_audit
after insert or update
on public.circle_schedule_events
for each row
execute function
  private.sm_record_audit_event();


drop trigger if exists
  circle_schedule_assignments_record_audit
on public.circle_schedule_assignments;


create trigger
  circle_schedule_assignments_record_audit
after insert or update
on public.circle_schedule_assignments
for each row
execute function
  private.sm_record_audit_event();


-- ============================================================
-- 7. PRIVILEGES
-- ============================================================

revoke all
on public.circle_schedule_events
from anon, authenticated;


revoke all
on public.circle_schedule_assignments
from anon, authenticated;


grant select, insert, update
on public.circle_schedule_events
to authenticated;


grant select, insert, update
on public.circle_schedule_assignments
to authenticated;


commit;