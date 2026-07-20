-- ============================================================
-- SMILING MONAD
-- Migration 001 — Secure Circle Foundation
--
-- Creates:
--   participants
--   circles
--   circle_members
--   circle_permissions
--   participant_consents
--
-- Security principles:
--   • Row Level Security on every private table.
--   • Access depends on active Circle membership.
--   • Administrator status gives no automatic participant access.
--   • Removed or suspended members lose access immediately.
-- ============================================================

begin;


-- ============================================================
-- 1. PRIVATE SECURITY SCHEMA
-- ============================================================

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

grant usage on schema private to authenticated;


-- ============================================================
-- 2. SHARED UPDATED_AT FUNCTION
-- ============================================================

create or replace function private.sm_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- 3. PARTICIPANTS
-- ============================================================

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  full_name text not null,
  preferred_name text not null default '',

  status text not null default 'active'
    check (
      status in (
        'active',
        'inactive',
        'archived'
      )
    ),

  date_of_birth date,

  pronouns text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',

  what_matters text not null default '',
  communication_support text not null default '',
  decision_support text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists
  participants_created_by_idx
on public.participants(created_by);

create index if not exists
  participants_status_idx
on public.participants(status);

drop trigger if exists
  participants_set_updated_at
on public.participants;

create trigger participants_set_updated_at
before update on public.participants
for each row
execute function private.sm_set_updated_at();


-- ============================================================
-- 4. CIRCLES
-- ============================================================

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),

  participant_id uuid not null
    references public.participants(id)
    on delete restrict,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  name text not null,

  status text not null default 'active'
    check (
      status in (
        'active',
        'paused',
        'archived'
      )
    ),

  purpose text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists
  circles_participant_id_idx
on public.circles(participant_id);

create index if not exists
  circles_created_by_idx
on public.circles(created_by);

create index if not exists
  circles_status_idx
on public.circles(status);

drop trigger if exists
  circles_set_updated_at
on public.circles;

create trigger circles_set_updated_at
before update on public.circles
for each row
execute function private.sm_set_updated_at();


-- ============================================================
-- 5. CIRCLE MEMBERS
-- ============================================================

create table if not exists public.circle_members (
  id uuid primary key default gen_random_uuid(),

  circle_id uuid not null
    references public.circles(id)
    on delete restrict,

  user_id uuid
    references auth.users(id)
    on delete restrict,

  invited_email text not null default '',
  display_name text not null default '',

  role text not null default 'circle_member'
    check (
      role in (
        'participant',
        'nominee',
        'family',
        'support_worker',
        'support_coordinator',
        'professional',
        'circle_manager',
        'circle_member'
      )
    ),

  relationship text not null default '',

  membership_status text not null default 'invited'
    check (
      membership_status in (
        'invited',
        'active',
        'suspended',
        'removed',
        'declined'
      )
    ),

  invited_by uuid
    references auth.users(id)
    on delete restrict,

  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  removed_at timestamptz,

  access_starts_at timestamptz,
  access_ends_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint circle_member_identity_required
    check (
      user_id is not null
      or length(trim(invited_email)) > 0
    )
);

create unique index if not exists
  circle_members_unique_user_per_circle_idx
on public.circle_members(circle_id, user_id)
where user_id is not null;

create index if not exists
  circle_members_circle_id_idx
on public.circle_members(circle_id);

create index if not exists
  circle_members_user_id_idx
on public.circle_members(user_id);

create index if not exists
  circle_members_status_idx
on public.circle_members(membership_status);

drop trigger if exists
  circle_members_set_updated_at
on public.circle_members;

create trigger circle_members_set_updated_at
before update on public.circle_members
for each row
execute function private.sm_set_updated_at();


-- ============================================================
-- 6. CIRCLE PERMISSIONS
-- ============================================================

create table if not exists public.circle_permissions (
  id uuid primary key default gen_random_uuid(),

  circle_member_id uuid not null unique
    references public.circle_members(id)
    on delete cascade,

  can_view_person_profile boolean not null default true,
  can_edit_person_profile boolean not null default false,

  can_view_members boolean not null default true,
  can_manage_members boolean not null default false,

  can_view_goals boolean not null default true,
  can_edit_goals boolean not null default false,

  can_view_documents boolean not null default false,
  can_upload_documents boolean not null default false,
  can_edit_documents boolean not null default false,

  can_view_meetings boolean not null default true,
  can_manage_meetings boolean not null default false,

  can_view_responsibilities boolean not null default true,
  can_edit_responsibilities boolean not null default false,

  can_view_budget boolean not null default false,
  can_edit_budget boolean not null default false,

  can_view_sensitive_information boolean not null default false,

  can_manage_consents boolean not null default false,
  can_manage_circle boolean not null default false,

  granted_by uuid
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists
  circle_permissions_member_id_idx
on public.circle_permissions(circle_member_id);

drop trigger if exists
  circle_permissions_set_updated_at
on public.circle_permissions;

create trigger circle_permissions_set_updated_at
before update on public.circle_permissions
for each row
execute function private.sm_set_updated_at();


-- ============================================================
-- 7. PARTICIPANT CONSENTS
-- ============================================================

create table if not exists public.participant_consents (
  id uuid primary key default gen_random_uuid(),

  participant_id uuid not null
    references public.participants(id)
    on delete restrict,

  circle_id uuid not null
    references public.circles(id)
    on delete restrict,

  consent_type text not null
    check (
      consent_type in (
        'circle_membership',
        'information_collection',
        'information_use',
        'information_sharing',
        'document_access',
        'health_information',
        'financial_information',
        'photography',
        'recording',
        'other'
      )
    ),

  consent_status text not null default 'draft'
    check (
      consent_status in (
        'draft',
        'active',
        'declined',
        'withdrawn',
        'expired',
        'superseded'
      )
    ),

  given_by_user_id uuid
    references auth.users(id)
    on delete restrict,

  given_by_name text not null default '',

  authority_basis text not null default 'self'
    check (
      authority_basis in (
        'self',
        'supported_decision',
        'nominee',
        'guardian',
        'parent',
        'other'
      )
    ),

  purpose text not null,
  information_scope text not null,
  recipient_scope text not null default '',

  restrictions text not null default '',
  evidence_notes text not null default '',

  valid_from timestamptz,
  valid_until timestamptz,

  withdrawn_at timestamptz,
  withdrawal_reason text not null default '',

  recorded_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint participant_consent_dates_valid
    check (
      valid_until is null
      or valid_from is null
      or valid_until > valid_from
    )
);

create index if not exists
  participant_consents_participant_id_idx
on public.participant_consents(participant_id);

create index if not exists
  participant_consents_circle_id_idx
on public.participant_consents(circle_id);

create index if not exists
  participant_consents_status_idx
on public.participant_consents(consent_status);

drop trigger if exists
  participant_consents_set_updated_at
on public.participant_consents;

create trigger participant_consents_set_updated_at
before update on public.participant_consents
for each row
execute function private.sm_set_updated_at();


-- ============================================================
-- 8. SECURITY HELPERS
-- ============================================================

create or replace function private.sm_is_active_circle_member(
  requested_circle_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.circle_members member
    where member.circle_id = requested_circle_id
      and member.user_id = auth.uid()
      and member.membership_status = 'active'
      and (
        member.access_starts_at is null
        or member.access_starts_at <= now()
      )
      and (
        member.access_ends_at is null
        or member.access_ends_at > now()
      )
  );
$$;


create or replace function private.sm_is_circle_creator(
  requested_circle_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.circles circle_record
    where circle_record.id = requested_circle_id
      and circle_record.created_by = auth.uid()
  );
$$;


create or replace function private.sm_is_participant_creator(
  requested_participant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.participants participant
    where participant.id = requested_participant_id
      and participant.created_by = auth.uid()
  );
$$;


create or replace function private.sm_participant_has_active_membership(
  requested_participant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.circles circle_record
    join public.circle_members member
      on member.circle_id = circle_record.id
    where circle_record.participant_id =
      requested_participant_id
      and member.user_id = auth.uid()
      and member.membership_status = 'active'
      and (
        member.access_starts_at is null
        or member.access_starts_at <= now()
      )
      and (
        member.access_ends_at is null
        or member.access_ends_at > now()
      )
  );
$$;


create or replace function private.sm_has_circle_permission(
  requested_circle_id uuid,
  requested_permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.circle_members member
    left join public.circle_permissions permission
      on permission.circle_member_id = member.id
    where member.circle_id = requested_circle_id
      and member.user_id = auth.uid()
      and member.membership_status = 'active'
      and (
        member.access_starts_at is null
        or member.access_starts_at <= now()
      )
      and (
        member.access_ends_at is null
        or member.access_ends_at > now()
      )
      and (
        member.role in (
          'participant',
          'circle_manager'
        )
        or case requested_permission
          when 'view_person_profile'
            then permission.can_view_person_profile
          when 'edit_person_profile'
            then permission.can_edit_person_profile
          when 'view_members'
            then permission.can_view_members
          when 'manage_members'
            then permission.can_manage_members
          when 'view_goals'
            then permission.can_view_goals
          when 'edit_goals'
            then permission.can_edit_goals
          when 'view_documents'
            then permission.can_view_documents
          when 'upload_documents'
            then permission.can_upload_documents
          when 'edit_documents'
            then permission.can_edit_documents
          when 'view_meetings'
            then permission.can_view_meetings
          when 'manage_meetings'
            then permission.can_manage_meetings
          when 'view_responsibilities'
            then permission.can_view_responsibilities
          when 'edit_responsibilities'
            then permission.can_edit_responsibilities
          when 'view_budget'
            then permission.can_view_budget
          when 'edit_budget'
            then permission.can_edit_budget
          when 'view_sensitive_information'
            then permission.can_view_sensitive_information
          when 'manage_consents'
            then permission.can_manage_consents
          when 'manage_circle'
            then permission.can_manage_circle
          else false
        end
      )
  );
$$;


-- Prevent recursive circle_members policies.
create or replace function private.sm_circle_has_members(
  requested_circle_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.circle_members member
    where member.circle_id = requested_circle_id
  );
$$;


revoke all on function private.sm_is_active_circle_member(uuid)
from public, anon;

revoke all on function private.sm_is_circle_creator(uuid)
from public, anon;

revoke all on function private.sm_is_participant_creator(uuid)
from public, anon;

revoke all on function private.sm_participant_has_active_membership(uuid)
from public, anon;

revoke all on function private.sm_has_circle_permission(uuid, text)
from public, anon;

revoke all on function private.sm_circle_has_members(uuid)
from public, anon;


grant execute
on function private.sm_is_active_circle_member(uuid)
to authenticated;

grant execute
on function private.sm_is_circle_creator(uuid)
to authenticated;

grant execute
on function private.sm_is_participant_creator(uuid)
to authenticated;

grant execute
on function private.sm_participant_has_active_membership(uuid)
to authenticated;

grant execute
on function private.sm_has_circle_permission(uuid, text)
to authenticated;

grant execute
on function private.sm_circle_has_members(uuid)
to authenticated;


-- ============================================================
-- 9. CORRECTED DEFAULT PERMISSIONS TRIGGER
-- ============================================================

create or replace function private.sm_create_default_circle_permissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.circle_permissions (
    circle_member_id,

    can_view_person_profile,
    can_edit_person_profile,

    can_view_members,
    can_manage_members,

    can_view_goals,
    can_edit_goals,

    can_view_documents,
    can_upload_documents,
    can_edit_documents,

    can_view_meetings,
    can_manage_meetings,

    can_view_responsibilities,
    can_edit_responsibilities,

    can_view_budget,
    can_edit_budget,

    can_view_sensitive_information,

    can_manage_consents,
    can_manage_circle,

    granted_by
  )
  values (
    new.id,

    true,
    new.role in (
      'participant',
      'nominee',
      'circle_manager'
    ),

    true,
    new.role in (
      'participant',
      'nominee',
      'circle_manager'
    ),

    true,
    new.role in (
      'participant',
      'nominee',
      'family',
      'support_coordinator',
      'circle_manager'
    ),

    new.role in (
      'participant',
      'nominee',
      'support_coordinator',
      'professional',
      'circle_manager'
    ),
    new.role in (
      'participant',
      'nominee',
      'support_coordinator',
      'professional',
      'circle_manager'
    ),
    new.role in (
      'participant',
      'nominee',
      'support_coordinator',
      'professional',
      'circle_manager'
    ),

    true,
    new.role in (
      'participant',
      'nominee',
      'support_coordinator',
      'circle_manager'
    ),

    true,
    new.role in (
      'participant',
      'nominee',
      'support_coordinator',
      'circle_manager'
    ),

    new.role in (
      'participant',
      'nominee',
      'support_coordinator',
      'circle_manager'
    ),
    new.role in (
      'participant',
      'nominee',
      'support_coordinator',
      'circle_manager'
    ),

    new.role in (
      'participant',
      'nominee',
      'professional',
      'circle_manager'
    ),

    new.role in (
      'participant',
      'nominee',
      'circle_manager'
    ),
    new.role in (
      'participant',
      'nominee',
      'circle_manager'
    ),

    new.invited_by
  )
  on conflict (circle_member_id) do nothing;

  return new;
end;
$$;


drop trigger if exists
  circle_members_create_default_permissions
on public.circle_members;

create trigger
  circle_members_create_default_permissions
after insert on public.circle_members
for each row
execute function private.sm_create_default_circle_permissions();


-- ============================================================
-- 10. ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table public.participants
  enable row level security;

alter table public.circles
  enable row level security;

alter table public.circle_members
  enable row level security;

alter table public.circle_permissions
  enable row level security;

alter table public.participant_consents
  enable row level security;


-- ============================================================
-- 11. REMOVE REPLACEABLE POLICIES
-- ============================================================

drop policy if exists
  "Users create participant records"
on public.participants;

drop policy if exists
  "Circle members read participants"
on public.participants;

drop policy if exists
  "Authorised members update participants"
on public.participants;


drop policy if exists
  "Participant creators create circles"
on public.circles;

drop policy if exists
  "Circle members read circles"
on public.circles;

drop policy if exists
  "Circle managers update circles"
on public.circles;


drop policy if exists
  "Circle members read memberships"
on public.circle_members;

drop policy if exists
  "Circle users create first owner membership"
on public.circle_members;

drop policy if exists
  "Circle managers invite members"
on public.circle_members;

drop policy if exists
  "Circle managers update memberships"
on public.circle_members;


drop policy if exists
  "Members read permitted permissions"
on public.circle_permissions;

drop policy if exists
  "Circle managers create permissions"
on public.circle_permissions;

drop policy if exists
  "Circle managers update permissions"
on public.circle_permissions;


drop policy if exists
  "Authorised members read consents"
on public.participant_consents;

drop policy if exists
  "Authorised members create consents"
on public.participant_consents;

drop policy if exists
  "Authorised members update consents"
on public.participant_consents;


-- ============================================================
-- 12. PARTICIPANT POLICIES
-- ============================================================

create policy
  "Users create participant records"
on public.participants
for insert
to authenticated
with check (
  created_by = auth.uid()
);


create policy
  "Circle members read participants"
on public.participants
for select
to authenticated
using (
  created_by = auth.uid()
  or private.sm_participant_has_active_membership(id)
);


create policy
  "Authorised members update participants"
on public.participants
for update
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.circles circle_record
    where circle_record.participant_id =
      participants.id
      and private.sm_has_circle_permission(
        circle_record.id,
        'edit_person_profile'
      )
  )
)
with check (
  created_by = participants.created_by
);


-- ============================================================
-- 13. CIRCLE POLICIES
-- ============================================================

create policy
  "Participant creators create circles"
on public.circles
for insert
to authenticated
with check (
  created_by = auth.uid()
  and private.sm_is_participant_creator(
    participant_id
  )
);


create policy
  "Circle members read circles"
on public.circles
for select
to authenticated
using (
  created_by = auth.uid()
  or private.sm_is_active_circle_member(id)
);


create policy
  "Circle managers update circles"
on public.circles
for update
to authenticated
using (
  created_by = auth.uid()
  or private.sm_has_circle_permission(
    id,
    'manage_circle'
  )
)
with check (
  participant_id = circles.participant_id
  and created_by = circles.created_by
);


-- ============================================================
-- 14. CIRCLE MEMBER POLICIES
-- ============================================================

create policy
  "Circle members read memberships"
on public.circle_members
for select
to authenticated
using (
  user_id = auth.uid()
  or private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'view_members'
  )
);


create policy
  "Circle users create first owner membership"
on public.circle_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and invited_by = auth.uid()
  and membership_status = 'active'
  and role in (
    'participant',
    'circle_manager'
  )
  and private.sm_is_circle_creator(circle_id)
  and not private.sm_circle_has_members(circle_id)
);


create policy
  "Circle managers invite members"
on public.circle_members
for insert
to authenticated
with check (
  invited_by = auth.uid()
  and private.sm_has_circle_permission(
    circle_id,
    'manage_members'
  )
);


create policy
  "Circle managers update memberships"
on public.circle_members
for update
to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'manage_members'
  )
)
with check (
  circle_id = circle_members.circle_id
);


-- ============================================================
-- 15. CIRCLE PERMISSION POLICIES
-- ============================================================

create policy
  "Members read permitted permissions"
on public.circle_permissions
for select
to authenticated
using (
  exists (
    select 1
    from public.circle_members member
    where member.id =
      circle_permissions.circle_member_id
      and (
        member.user_id = auth.uid()
        or private.sm_is_circle_creator(
          member.circle_id
        )
        or private.sm_has_circle_permission(
          member.circle_id,
          'manage_members'
        )
      )
  )
);


create policy
  "Circle managers create permissions"
on public.circle_permissions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.circle_members member
    where member.id =
      circle_permissions.circle_member_id
      and (
        private.sm_is_circle_creator(
          member.circle_id
        )
        or private.sm_has_circle_permission(
          member.circle_id,
          'manage_members'
        )
      )
  )
);


create policy
  "Circle managers update permissions"
on public.circle_permissions
for update
to authenticated
using (
  exists (
    select 1
    from public.circle_members member
    where member.id =
      circle_permissions.circle_member_id
      and (
        private.sm_is_circle_creator(
          member.circle_id
        )
        or private.sm_has_circle_permission(
          member.circle_id,
          'manage_members'
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.circle_members member
    where member.id =
      circle_permissions.circle_member_id
      and (
        private.sm_is_circle_creator(
          member.circle_id
        )
        or private.sm_has_circle_permission(
          member.circle_id,
          'manage_members'
        )
      )
  )
);


-- ============================================================
-- 16. CONSENT POLICIES
-- ============================================================

create policy
  "Authorised members read consents"
on public.participant_consents
for select
to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'view_sensitive_information'
  )
  or private.sm_has_circle_permission(
    circle_id,
    'manage_consents'
  )
);


create policy
  "Authorised members create consents"
on public.participant_consents
for insert
to authenticated
with check (
  recorded_by = auth.uid()
  and (
    private.sm_is_circle_creator(circle_id)
    or private.sm_has_circle_permission(
      circle_id,
      'manage_consents'
    )
  )
  and exists (
    select 1
    from public.circles circle_record
    where circle_record.id =
      participant_consents.circle_id
      and circle_record.participant_id =
        participant_consents.participant_id
  )
);


create policy
  "Authorised members update consents"
on public.participant_consents
for update
to authenticated
using (
  private.sm_is_circle_creator(circle_id)
  or private.sm_has_circle_permission(
    circle_id,
    'manage_consents'
  )
)
with check (
  exists (
    select 1
    from public.circles circle_record
    where circle_record.id =
      participant_consents.circle_id
      and circle_record.participant_id =
        participant_consents.participant_id
  )
);


-- ============================================================
-- 17. TABLE PRIVILEGES
-- ============================================================

revoke all on public.participants from anon;
revoke all on public.circles from anon;
revoke all on public.circle_members from anon;
revoke all on public.circle_permissions from anon;
revoke all on public.participant_consents from anon;


grant select, insert, update
on public.participants
to authenticated;

grant select, insert, update
on public.circles
to authenticated;

grant select, insert, update
on public.circle_members
to authenticated;

grant select, insert, update
on public.circle_permissions
to authenticated;

grant select, insert, update
on public.participant_consents
to authenticated;


commit;