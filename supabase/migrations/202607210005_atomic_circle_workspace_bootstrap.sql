-- ============================================================
-- SMILING MONAD
-- Migration 005 — Atomic Circle Workspace Bootstrap
--
-- Creates:
--   public.sm_open_or_create_circle_workspace()
--
-- The function:
--   • requires a signed-in Supabase user
--   • returns the user’s first active Circle when one exists
--   • otherwise creates the participant, Circle and owner
--     membership together in one transaction
--   • gives administrators no automatic participant access
-- ============================================================

begin;


-- ============================================================
-- 1. ATOMIC WORKSPACE FUNCTION
-- ============================================================

create or replace function public.sm_open_or_create_circle_workspace()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  current_email text;
  default_display_name text;

  resolved_participant public.participants%rowtype;
  resolved_circle public.circles%rowtype;
  resolved_membership public.circle_members%rowtype;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception
      'You must be signed in to open a Circle of Support'
      using errcode = '42501';
  end if;


  -- Prevent two simultaneous requests from creating duplicate
  -- workspaces for the same account.
  perform pg_advisory_xact_lock(
    hashtextextended(
      current_user_id::text,
      0
    )
  );


  -- ----------------------------------------------------------
  -- Return the user’s existing active Circle membership.
  -- ----------------------------------------------------------

  select member.*
  into resolved_membership
  from public.circle_members member
  where member.user_id = current_user_id
    and member.membership_status = 'active'
    and (
      member.access_starts_at is null
      or member.access_starts_at <= now()
    )
    and (
      member.access_ends_at is null
      or member.access_ends_at > now()
    )
  order by member.created_at asc
  limit 1;


  if found then
    select circle_record.*
    into resolved_circle
    from public.circles circle_record
    where circle_record.id =
      resolved_membership.circle_id;


    if not found then
      raise exception
        'The active Circle membership refers to a missing Circle';
    end if;


    select participant.*
    into resolved_participant
    from public.participants participant
    where participant.id =
      resolved_circle.participant_id;


    if not found then
      raise exception
        'The Circle refers to a missing participant';
    end if;


    return jsonb_build_object(
      'participant',
      to_jsonb(resolved_participant),

      'circle',
      to_jsonb(resolved_circle),

      'membership',
      to_jsonb(resolved_membership),

      'created',
      false
    );
  end if;


  -- ----------------------------------------------------------
  -- Build a default display name from the authenticated user.
  -- ----------------------------------------------------------

  current_email :=
    coalesce(
      auth.jwt() ->> 'email',
      ''
    );


  default_display_name :=
    nullif(
      trim(
        coalesce(
          auth.jwt()
            -> 'user_metadata'
            ->> 'full_name',

          auth.jwt()
            -> 'user_metadata'
            ->> 'name',

          ''
        )
      ),
      ''
    );


  if default_display_name is null then
    default_display_name :=
      nullif(
        split_part(
          current_email,
          '@',
          1
        ),
        ''
      );
  end if;


  if default_display_name is null then
    default_display_name :=
      'Circle owner';
  end if;


  -- ----------------------------------------------------------
  -- Create the participant.
  -- ----------------------------------------------------------

  insert into public.participants (
    created_by,
    full_name,
    preferred_name,
    status,
    what_matters,
    communication_support,
    decision_support
  )
  values (
    current_user_id,
    default_display_name,
    default_display_name,
    'active',
    '',
    '',
    ''
  )
  returning *
  into resolved_participant;


  -- ----------------------------------------------------------
  -- Create the Circle.
  -- ----------------------------------------------------------

  insert into public.circles (
    participant_id,
    created_by,
    name,
    status,
    purpose
  )
  values (
    resolved_participant.id,
    current_user_id,
    default_display_name ||
      '''s Circle of Support',
    'active',
    'Coordinate support around the life, choices and goals of the person.'
  )
  returning *
  into resolved_circle;


  -- ----------------------------------------------------------
  -- Create the first active Circle-manager membership.
  --
  -- The default-permissions trigger creates the matching
  -- circle_permissions record.
  -- ----------------------------------------------------------

  insert into public.circle_members (
    circle_id,
    user_id,
    invited_email,
    display_name,
    role,
    relationship,
    membership_status,
    invited_by,
    invited_at,
    accepted_at,
    access_starts_at
  )
  values (
    resolved_circle.id,
    current_user_id,
    current_email,
    default_display_name,
    'circle_manager',
    'Circle creator',
    'active',
    current_user_id,
    now(),
    now(),
    now()
  )
  returning *
  into resolved_membership;


  return jsonb_build_object(
    'participant',
    to_jsonb(resolved_participant),

    'circle',
    to_jsonb(resolved_circle),

    'membership',
    to_jsonb(resolved_membership),

    'created',
    true
  );
end;
$$;


-- ============================================================
-- 2. FUNCTION ACCESS
-- ============================================================

revoke all
on function public.sm_open_or_create_circle_workspace()
from public;


revoke all
on function public.sm_open_or_create_circle_workspace()
from anon;


grant execute
on function public.sm_open_or_create_circle_workspace()
to authenticated;


commit;