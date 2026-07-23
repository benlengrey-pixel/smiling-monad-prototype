-- ============================================================
-- SMILING MONAD
-- Migration 011 — Correct Personal Circle Classification
--
-- Fixes:
--   • participant Circles created by a worker were being treated
--     as the worker's own personal Circle
--   • creating or opening "My own Circle" could return a Circle
--     that the user created for another participant
--
-- Privacy:
--   • a personal Circle is recognised only when the signed-in
--     user is its active participant member
--   • participant Circles remain under "Circles I support"
--   • no Circle access or membership permissions are expanded
-- ============================================================

begin;


-- ============================================================
-- 1. LIST ACTIVE CIRCLES WITH CORRECT PERSONAL CLASSIFICATION
-- ============================================================

create or replace function
  public.sm_list_my_circles()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  circle_directory jsonb;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception
      'You must be signed in to view your Circles'
      using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'circle',
        jsonb_build_object(
          'id',
          circle_record.id,

          'participant_id',
          circle_record.participant_id,

          'created_by',
          circle_record.created_by,

          'name',
          circle_record.name,

          'status',
          circle_record.status,

          'purpose',
          circle_record.purpose,

          'created_at',
          circle_record.created_at,

          'updated_at',
          circle_record.updated_at
        ),

        'participant',
        jsonb_build_object(
          'id',
          participant_record.id,

          'full_name',
          participant_record.full_name,

          'preferred_name',
          participant_record.preferred_name,

          'status',
          participant_record.status
        ),

        'membership',
        jsonb_build_object(
          'id',
          member.id,

          'circle_id',
          member.circle_id,

          'user_id',
          member.user_id,

          'display_name',
          member.display_name,

          'role',
          member.role,

          'relationship',
          member.relationship,

          'membership_status',
          member.membership_status,

          'access_starts_at',
          member.access_starts_at,

          'access_ends_at',
          member.access_ends_at,

          'accepted_at',
          member.accepted_at
        ),

        'is_owned_circle',
        (
          member.role = 'participant'
          and circle_record.created_by =
            current_user_id
          and participant_record.created_by =
            current_user_id
        )
      )
      order by
        (
          member.role = 'participant'
          and circle_record.created_by =
            current_user_id
          and participant_record.created_by =
            current_user_id
        ) desc,

        coalesce(
          nullif(
            trim(
              participant_record.preferred_name
            ),
            ''
          ),
          participant_record.full_name,
          circle_record.name
        ) asc,

        member.created_at asc
    ),
    '[]'::jsonb
  )
  into circle_directory
  from public.circle_members member
  join public.circles circle_record
    on circle_record.id =
      member.circle_id
  join public.participants participant_record
    on participant_record.id =
      circle_record.participant_id
  where member.user_id =
      current_user_id
    and member.membership_status =
      'active'
    and (
      member.access_starts_at is null
      or member.access_starts_at <= now()
    )
    and (
      member.access_ends_at is null
      or member.access_ends_at > now()
    )
    and circle_record.status <>
      'archived'
    and participant_record.status <>
      'archived';

  return jsonb_build_object(
    'circles',
    circle_directory
  );
end;
$$;


-- ============================================================
-- 2. CREATE OR REOPEN ONLY THE USER'S PERSONAL CIRCLE
-- ============================================================

create or replace function
  public.sm_create_my_circle()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  current_email text;
  default_display_name text;

  resolved_participant
    public.participants%rowtype;

  resolved_circle
    public.circles%rowtype;

  resolved_membership
    public.circle_members%rowtype;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception
      'You must be signed in to create your Circle'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      'sm-create-my-circle:' ||
        current_user_id::text,
      0
    )
  );


  -- ----------------------------------------------------------
  -- Reopen only a Circle where this account is the participant.
  -- A Circle created for another person must never be returned
  -- as this user's own personal Circle.
  -- ----------------------------------------------------------

  select member.*
  into resolved_membership
  from public.circle_members member
  join public.circles circle_record
    on circle_record.id =
      member.circle_id
  join public.participants participant_record
    on participant_record.id =
      circle_record.participant_id
  where member.user_id =
      current_user_id
    and member.role =
      'participant'
    and member.membership_status =
      'active'
    and (
      member.access_starts_at is null
      or member.access_starts_at <= now()
    )
    and (
      member.access_ends_at is null
      or member.access_ends_at > now()
    )
    and circle_record.created_by =
      current_user_id
    and participant_record.created_by =
      current_user_id
    and circle_record.status <>
      'archived'
    and participant_record.status <>
      'archived'
  order by circle_record.created_at asc
  limit 1;

  if found then
    select circle_record.*
    into resolved_circle
    from public.circles circle_record
    where circle_record.id =
      resolved_membership.circle_id;

    select participant_record.*
    into resolved_participant
    from public.participants participant_record
    where participant_record.id =
      resolved_circle.participant_id;

    return jsonb_build_object(
      'participant',
      to_jsonb(
        resolved_participant
      ),

      'circle',
      to_jsonb(
        resolved_circle
      ),

      'membership',
      to_jsonb(
        resolved_membership
      ),

      'created',
      false
    );
  end if;


  -- ----------------------------------------------------------
  -- Resolve the signed-in person's display name.
  -- ----------------------------------------------------------

  current_email :=
    lower(
      trim(
        coalesce(
          auth.jwt() ->> 'email',
          ''
        )
      )
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
  -- Create a minimal participant record for the account owner.
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
  -- Create the user's personal Circle.
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
    'Coordinate support around my life, choices and goals.'
  )
  returning *
  into resolved_circle;


  -- ----------------------------------------------------------
  -- The signed-in user is the participant of this Circle.
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
    'participant',
    'Self',
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
    to_jsonb(
      resolved_participant
    ),

    'circle',
    to_jsonb(
      resolved_circle
    ),

    'membership',
    to_jsonb(
      resolved_membership
    ),

    'created',
    true
  );
end;
$$;


-- ============================================================
-- 3. FUNCTION ACCESS
-- ============================================================

revoke all
on function
  public.sm_list_my_circles()
from public, anon;

grant execute
on function
  public.sm_list_my_circles()
to authenticated;


revoke all
on function
  public.sm_create_my_circle()
from public, anon;

grant execute
on function
  public.sm_create_my_circle()
to authenticated;


commit;