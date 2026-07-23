-- ============================================================
-- SMILING MONAD
-- Migration 010 — Participant Circle Creation
--
-- Adds:
--   • immutable setup declarations for Circles created for others
--   • public.sm_create_participant_circle(...)
--
-- Purpose:
--   • let a signed-in user create more than one Circle
--   • create a distinct participant record for each new Circle
--   • record the creator's role and stated authority/consent basis
--   • give the creator active access only to the Circle they create
--
-- Privacy:
--   • no administrator receives automatic Circle access
--   • setup declarations are visible only to active Circle members
--   • declarations cannot be edited or deleted through the app
--   • only minimal participant information is created initially
-- ============================================================

begin;


-- ============================================================
-- 1. IMMUTABLE CIRCLE SETUP DECLARATIONS
-- ============================================================

create table if not exists
  public.circle_setup_declarations (
    id uuid primary key
      default gen_random_uuid(),

    circle_id uuid not null
      references public.circles(id)
      on delete restrict,

    participant_id uuid not null
      references public.participants(id)
      on delete restrict,

    declared_by uuid not null
      references auth.users(id)
      on delete restrict,

    authority_type text not null
      check (
        authority_type in (
          'participant_request',
          'nominee_authority',
          'family_agreement',
          'support_setup_request',
          'other'
        )
      ),

    authority_basis text not null,

    confirmed_at timestamptz not null
      default now(),

    created_at timestamptz not null
      default now(),

    constraint
      circle_setup_declarations_one_per_circle
      unique (circle_id),

    constraint
      circle_setup_declarations_basis_length
      check (
        length(trim(authority_basis))
        between 10 and 1000
      )
  );


create index if not exists
  circle_setup_declarations_participant_idx
on public.circle_setup_declarations(
  participant_id,
  created_at desc
);


create index if not exists
  circle_setup_declarations_declared_by_idx
on public.circle_setup_declarations(
  declared_by,
  created_at desc
);


alter table
  public.circle_setup_declarations
  enable row level security;


drop policy if exists
  "Active Circle members read setup declarations"
on public.circle_setup_declarations;


create policy
  "Active Circle members read setup declarations"
on public.circle_setup_declarations
for select
to authenticated
using (
  exists (
    select 1
    from public.circle_members member
    where member.circle_id = circle_id
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
  )
);


revoke all
on public.circle_setup_declarations
from public, anon, authenticated;


grant select
on public.circle_setup_declarations
to authenticated;


-- ============================================================
-- 2. CREATE A NEW CIRCLE FOR ANOTHER PERSON
-- ============================================================

create or replace function
  public.sm_create_participant_circle(
    p_full_name text,
    p_preferred_name text default '',
    p_circle_name text default '',
    p_creator_role text default 'circle_manager',
    p_relationship text default '',
    p_authority_type text default 'other',
    p_authority_basis text default '',
    p_authority_confirmed boolean default false
  )
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  current_email text;
  current_display_name text;

  clean_full_name text;
  clean_preferred_name text;
  clean_circle_name text;
  clean_relationship text;
  clean_authority_basis text;

  resolved_participant public.participants%rowtype;
  resolved_circle public.circles%rowtype;
  resolved_membership public.circle_members%rowtype;
  declaration_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception
      'You must be signed in to create a Circle'
      using errcode = '42501';
  end if;

  if p_authority_confirmed is not true then
    raise exception
      'Confirm the participant request, consent or authority basis before creating this Circle'
      using errcode = '22023';
  end if;

  clean_full_name :=
    trim(coalesce(p_full_name, ''));

  clean_preferred_name :=
    trim(coalesce(p_preferred_name, ''));

  clean_relationship :=
    trim(coalesce(p_relationship, ''));

  clean_authority_basis :=
    trim(coalesce(p_authority_basis, ''));

  if length(clean_full_name)
      not between 2 and 160
  then
    raise exception
      'The participant name must contain between 2 and 160 characters'
      using errcode = '22023';
  end if;

  if length(clean_preferred_name) > 120 then
    raise exception
      'The preferred name must contain 120 characters or fewer'
      using errcode = '22023';
  end if;

  if length(clean_relationship)
      not between 2 and 160
  then
    raise exception
      'Describe your relationship to the person using between 2 and 160 characters'
      using errcode = '22023';
  end if;

  if length(clean_authority_basis)
      not between 10 and 1000
  then
    raise exception
      'Describe the participant request, consent or authority basis using between 10 and 1000 characters'
      using errcode = '22023';
  end if;

  if p_creator_role not in (
    'nominee',
    'family',
    'support_worker',
    'support_coordinator',
    'professional',
    'circle_manager',
    'circle_member'
  ) then
    raise exception
      'The selected Circle role is not valid'
      using errcode = '22023';
  end if;

  if p_authority_type not in (
    'participant_request',
    'nominee_authority',
    'family_agreement',
    'support_setup_request',
    'other'
  ) then
    raise exception
      'The selected authority type is not valid'
      using errcode = '22023';
  end if;

  clean_circle_name :=
    trim(coalesce(p_circle_name, ''));

  if clean_circle_name = '' then
    clean_circle_name :=
      coalesce(
        nullif(clean_preferred_name, ''),
        clean_full_name
      ) || '''s Circle of Support';
  end if;

  if length(clean_circle_name)
      not between 3 and 180
  then
    raise exception
      'The Circle name must contain between 3 and 180 characters'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      'sm-create-participant-circle:' ||
        current_user_id::text || ':' ||
        lower(clean_circle_name),
      0
    )
  );

  if exists (
    select 1
    from public.circles circle_record
    where circle_record.created_by =
        current_user_id
      and circle_record.status <> 'archived'
      and lower(trim(circle_record.name)) =
        lower(clean_circle_name)
  ) then
    raise exception
      'A Circle with this name already exists. Open it from My Circles instead.'
      using errcode = '23505';
  end if;

  current_email :=
    lower(
      trim(
        coalesce(
          auth.jwt() ->> 'email',
          ''
        )
      )
    );

  current_display_name :=
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

  if current_display_name is null then
    current_display_name :=
      nullif(
        split_part(
          current_email,
          '@',
          1
        ),
        ''
      );
  end if;

  if current_display_name is null then
    current_display_name :=
      'Circle creator';
  end if;


  -- ----------------------------------------------------------
  -- Create only a minimal participant profile. Additional
  -- personal or sensitive information must be added later by
  -- an authorised Circle member through normal permissions.
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
    clean_full_name,
    clean_preferred_name,
    'active',
    '',
    '',
    ''
  )
  returning *
  into resolved_participant;


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
    clean_circle_name,
    'active',
    'Coordinate support around ' ||
      coalesce(
        nullif(clean_preferred_name, ''),
        clean_full_name
      ) ||
      '''s life, choices and goals.'
  )
  returning *
  into resolved_circle;


  -- ----------------------------------------------------------
  -- The creator receives only the role they selected. They are
  -- not automatically recorded as the participant.
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
    current_display_name,
    p_creator_role,
    clean_relationship,
    'active',
    current_user_id,
    now(),
    now(),
    now()
  )
  returning *
  into resolved_membership;


  insert into
    public.circle_setup_declarations (
      circle_id,
      participant_id,
      declared_by,
      authority_type,
      authority_basis,
      confirmed_at
    )
  values (
    resolved_circle.id,
    resolved_participant.id,
    current_user_id,
    p_authority_type,
    clean_authority_basis,
    now()
  )
  returning id
  into declaration_id;


  return jsonb_build_object(
    'participant',
    to_jsonb(resolved_participant),

    'circle',
    to_jsonb(resolved_circle),

    'membership',
    to_jsonb(resolved_membership),

    'created',
    true,

    'setup_declaration_id',
    declaration_id
  );
end;
$$;


-- ============================================================
-- 3. FUNCTION ACCESS
-- ============================================================

revoke all
on function
  public.sm_create_participant_circle(
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    boolean
  )
from public, anon;


grant execute
on function
  public.sm_create_participant_circle(
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    boolean
  )
to authenticated;


commit;