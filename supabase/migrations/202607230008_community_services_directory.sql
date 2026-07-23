-- ============================================================
-- SMILING MONAD
-- Migration 008 — Community Services Directory
--
-- Creates a moderated, searchable directory for:
--   • support workers and providers
--   • support coordinators
--   • therapists and allied health professionals
--   • community groups and activities
--   • transport, respite, housing and employment services
--   • training and disability-friendly businesses
--
-- Privacy and trust:
--   • listings are not public until approved
--   • listing owners control the information they submit
--   • public contact details are optional and intentional
--   • participant and Circle information is never stored here
--   • service claims are recorded but not treated as verified
--     unless a moderator explicitly verifies them
-- ============================================================

begin;


-- ============================================================
-- 1. COMMUNITY MODERATORS
--
-- This table is managed by the Supabase service role or SQL
-- editor. Adding a user here gives them directory moderation
-- authority. Directory providers cannot approve themselves
-- unless they have separately been made a moderator.
-- ============================================================

create table if not exists
  public.community_service_moderators (
    user_id uuid primary key
      references auth.users(id)
      on delete restrict,

    is_active boolean not null
      default true,

    appointed_at timestamptz not null
      default now(),

    appointed_by uuid
      references auth.users(id)
      on delete restrict,

    notes text not null
      default ''
  );


alter table
  public.community_service_moderators
enable row level security;


drop policy if exists
  "Community moderators can read their own appointment"
on public.community_service_moderators;


create policy
  "Community moderators can read their own appointment"
on public.community_service_moderators
for select
to authenticated
using (
  user_id = auth.uid()
);


revoke all
on public.community_service_moderators
from anon, authenticated;


grant select
on public.community_service_moderators
to authenticated;


create or replace function
  private.sm_is_community_service_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.community_service_moderators moderator
    where moderator.user_id = auth.uid()
      and moderator.is_active = true
  );
$$;


revoke all
on function
  private.sm_is_community_service_moderator()
from public, anon;


grant execute
on function
  private.sm_is_community_service_moderator()
to authenticated;


-- ============================================================
-- 2. SERVICE LISTINGS
-- ============================================================

create table if not exists
  public.community_service_listings (
    id uuid primary key
      default gen_random_uuid(),

    owner_user_id uuid not null
      references auth.users(id)
      on delete restrict,

    provider_type text not null
      default 'organisation'
      check (
        provider_type in (
          'individual',
          'organisation',
          'community_group',
          'business'
        )
      ),

    organisation_name text not null,
    service_name text not null,

    service_category text not null
      check (
        service_category in (
          'support_work',
          'support_coordination',
          'allied_health',
          'therapy',
          'community_access',
          'transport',
          'respite',
          'housing',
          'employment',
          'education_training',
          'plan_management',
          'assistive_technology',
          'advocacy',
          'social_group',
          'health_wellbeing',
          'disability_friendly_business',
          'other'
        )
      ),

    summary text not null,
    description text not null,

    service_areas text[] not null
      default array[]::text[],

    delivery_methods text[] not null
      default array['in_person']::text[],

    age_groups text[] not null
      default array['adults']::text[],

    accessibility_features text[] not null
      default array[]::text[],

    languages text[] not null
      default array['English']::text[],

    availability_summary text not null
      default '',

    pricing_summary text not null
      default '',

    accepts_ndis_funding boolean not null
      default false,

    ndis_registration_status text not null
      default 'not_stated'
      check (
        ndis_registration_status in (
          'registered',
          'unregistered',
          'not_applicable',
          'not_stated'
        )
      ),

    abn text not null
      default '',

    website_url text not null
      default '',

    public_email text not null
      default '',

    public_phone text not null
      default '',

    search_text text not null
      default '',

    verification_status text not null
      default 'unverified'
      check (
        verification_status in (
          'unverified',
          'claimed',
          'verified',
          'rejected'
        )
      ),

    moderation_status text not null
      default 'draft'
      check (
        moderation_status in (
          'draft',
          'submitted',
          'approved',
          'rejected',
          'suspended',
          'archived'
        )
      ),

    submitted_at timestamptz,
    approved_at timestamptz,
    published_at timestamptz,
    review_due_at date,
    archived_at timestamptz,

    created_at timestamptz not null
      default now(),

    updated_at timestamptz not null
      default now(),

    constraint
      community_service_listings_delivery_methods_valid
      check (
        delivery_methods <@
        array[
          'in_person',
          'online',
          'phone',
          'home_visit',
          'community',
          'group',
          'other'
        ]::text[]
      ),

    constraint
      community_service_listings_age_groups_valid
      check (
        age_groups <@
        array[
          'children',
          'teenagers',
          'young_adults',
          'adults',
          'older_people',
          'all_ages'
        ]::text[]
      ),

    constraint
      community_service_listings_public_email_valid
      check (
        public_email = ''
        or public_email ~*
          '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
      )
  );


create index if not exists
  community_service_listings_owner_idx
on public.community_service_listings(
  owner_user_id
);


create index if not exists
  community_service_listings_status_idx
on public.community_service_listings(
  moderation_status
);


create index if not exists
  community_service_listings_category_idx
on public.community_service_listings(
  service_category
);


create index if not exists
  community_service_listings_provider_type_idx
on public.community_service_listings(
  provider_type
);


create index if not exists
  community_service_listings_ndis_status_idx
on public.community_service_listings(
  ndis_registration_status
);


create index if not exists
  community_service_listings_service_areas_gin_idx
on public.community_service_listings
using gin(service_areas);


create index if not exists
  community_service_listings_delivery_methods_gin_idx
on public.community_service_listings
using gin(delivery_methods);


create index if not exists
  community_service_listings_age_groups_gin_idx
on public.community_service_listings
using gin(age_groups);


create index if not exists
  community_service_listings_search_idx
on public.community_service_listings
using gin (
  to_tsvector(
    'english'::regconfig,
    search_text
  )
);


drop trigger if exists
  community_service_listings_set_updated_at
on public.community_service_listings;


create trigger
  community_service_listings_set_updated_at
before update
on public.community_service_listings
for each row
execute function private.sm_set_updated_at();


-- ============================================================
-- 3. LISTING VALIDATION AND RESUBMISSION
-- ============================================================

create or replace function
  private.sm_validate_community_service_listing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  content_changed boolean := false;
begin
  new.organisation_name :=
    trim(new.organisation_name);

  new.service_name :=
    trim(new.service_name);

  new.summary :=
    trim(new.summary);

  new.description :=
    trim(new.description);

  new.availability_summary :=
    trim(new.availability_summary);

  new.pricing_summary :=
    trim(new.pricing_summary);

  new.abn :=
    trim(new.abn);

  new.website_url :=
    trim(new.website_url);

  new.public_email :=
    lower(trim(new.public_email));

  new.public_phone :=
    trim(new.public_phone);

  new.search_text :=
    concat_ws(
      ' ',
      new.organisation_name,
      new.service_name,
      new.summary,
      new.description,
      array_to_string(
        new.service_areas,
        ' '
      ),
      array_to_string(
        new.delivery_methods,
        ' '
      ),
      array_to_string(
        new.age_groups,
        ' '
      ),
      array_to_string(
        new.accessibility_features,
        ' '
      ),
      array_to_string(
        new.languages,
        ' '
      )
    );

  new.languages :=
    array(
      select distinct trim(value)
      from unnest(new.languages) value
      where length(trim(value)) > 0
    );

  new.service_areas :=
    array(
      select distinct trim(value)
      from unnest(new.service_areas) value
      where length(trim(value)) > 0
    );

  new.accessibility_features :=
    array(
      select distinct trim(value)
      from unnest(new.accessibility_features) value
      where length(trim(value)) > 0
    );

  if length(new.organisation_name) = 0 then
    raise exception
      'Organisation or provider name is required';
  end if;

  if length(new.service_name) = 0 then
    raise exception
      'Service name is required';
  end if;

  if length(new.summary) < 20 then
    raise exception
      'The service summary must contain at least 20 characters';
  end if;

  if length(new.description) < 50 then
    raise exception
      'The service description must contain at least 50 characters';
  end if;

  if cardinality(new.service_areas) = 0 then
    raise exception
      'At least one service area is required';
  end if;

  if cardinality(new.delivery_methods) = 0 then
    raise exception
      'At least one delivery method is required';
  end if;

  if cardinality(new.age_groups) = 0 then
    raise exception
      'At least one age group is required';
  end if;

  if tg_op = 'INSERT' then
    if new.moderation_status = 'submitted' then
      new.submitted_at := now();
    else
      new.moderation_status := 'draft';
      new.submitted_at := null;
    end if;

    new.approved_at := null;
    new.published_at := null;
    new.archived_at := null;

    if new.verification_status = 'verified' then
      new.verification_status := 'claimed';
    end if;

    return new;
  end if;

  content_changed :=
    new.provider_type is distinct from old.provider_type
    or new.organisation_name is distinct from old.organisation_name
    or new.service_name is distinct from old.service_name
    or new.service_category is distinct from old.service_category
    or new.summary is distinct from old.summary
    or new.description is distinct from old.description
    or new.service_areas is distinct from old.service_areas
    or new.delivery_methods is distinct from old.delivery_methods
    or new.age_groups is distinct from old.age_groups
    or new.accessibility_features is distinct from old.accessibility_features
    or new.languages is distinct from old.languages
    or new.availability_summary is distinct from old.availability_summary
    or new.pricing_summary is distinct from old.pricing_summary
    or new.accepts_ndis_funding is distinct from old.accepts_ndis_funding
    or new.ndis_registration_status is distinct from old.ndis_registration_status
    or new.abn is distinct from old.abn
    or new.website_url is distinct from old.website_url
    or new.public_email is distinct from old.public_email
    or new.public_phone is distinct from old.public_phone;

  if auth.uid() = old.owner_user_id
     and content_changed
     and old.moderation_status = 'approved'
  then
    new.moderation_status := 'submitted';
    new.submitted_at := now();
    new.approved_at := null;
    new.published_at := null;

    if old.verification_status = 'verified' then
      new.verification_status := 'claimed';
    end if;
  elsif auth.uid() = old.owner_user_id
        and new.moderation_status = 'submitted'
        and old.moderation_status <> 'submitted'
  then
    new.submitted_at := now();
    new.approved_at := null;
    new.published_at := null;
  end if;

  if new.moderation_status = 'archived'
     and new.archived_at is null
  then
    new.archived_at := now();
    new.published_at := null;
  elsif new.moderation_status <> 'archived' then
    new.archived_at := null;
  end if;

  return new;
end;
$$;


revoke all
on function
  private.sm_validate_community_service_listing()
from public, anon;


drop trigger if exists
  community_service_listings_validate
on public.community_service_listings;


create trigger
  community_service_listings_validate
before insert or update
on public.community_service_listings
for each row
execute function
  private.sm_validate_community_service_listing();


-- ============================================================
-- 4. MODERATION REVIEWS
-- ============================================================

create table if not exists
  public.community_service_listing_reviews (
    id uuid primary key
      default gen_random_uuid(),

    listing_id uuid not null
      references public.community_service_listings(id)
      on delete restrict,

    moderator_user_id uuid not null
      references auth.users(id)
      on delete restrict,

    decision text not null
      check (
        decision in (
          'approved',
          'rejected',
          'suspended'
        )
      ),

    reason text not null
      default '',

    verification_status text
      check (
        verification_status is null
        or verification_status in (
          'unverified',
          'claimed',
          'verified',
          'rejected'
        )
      ),

    review_due_at date,

    created_at timestamptz not null
      default now()
  );


create index if not exists
  community_service_listing_reviews_listing_idx
on public.community_service_listing_reviews(
  listing_id,
  created_at desc
);


create index if not exists
  community_service_listing_reviews_moderator_idx
on public.community_service_listing_reviews(
  moderator_user_id,
  created_at desc
);


alter table
  public.community_service_listing_reviews
enable row level security;


drop policy if exists
  "Listing owners read their moderation reviews"
on public.community_service_listing_reviews;


drop policy if exists
  "Community moderators read all directory reviews"
on public.community_service_listing_reviews;


create policy
  "Listing owners read their moderation reviews"
on public.community_service_listing_reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.community_service_listings listing
    where listing.id = listing_id
      and listing.owner_user_id =
        auth.uid()
  )
);


create policy
  "Community moderators read all directory reviews"
on public.community_service_listing_reviews
for select
to authenticated
using (
  private.sm_is_community_service_moderator()
);


revoke all
on public.community_service_listing_reviews
from anon, authenticated;


grant select
on public.community_service_listing_reviews
to authenticated;


-- ============================================================
-- 5. LISTING SAVES
-- ============================================================

create table if not exists
  public.community_service_listing_saves (
    user_id uuid not null
      references auth.users(id)
      on delete cascade,

    listing_id uuid not null
      references public.community_service_listings(id)
      on delete cascade,

    created_at timestamptz not null
      default now(),

    primary key (
      user_id,
      listing_id
    )
  );


create index if not exists
  community_service_listing_saves_listing_idx
on public.community_service_listing_saves(
  listing_id
);


alter table
  public.community_service_listing_saves
enable row level security;


drop policy if exists
  "People manage their own saved services"
on public.community_service_listing_saves;


create policy
  "People manage their own saved services"
on public.community_service_listing_saves
for all
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);


revoke all
on public.community_service_listing_saves
from anon, authenticated;


grant select, insert, delete
on public.community_service_listing_saves
to authenticated;


-- ============================================================
-- 6. SERVICE LISTING ACCESS
-- ============================================================

alter table
  public.community_service_listings
enable row level security;


drop policy if exists
  "Public reads approved service listings"
on public.community_service_listings;


drop policy if exists
  "Listing owners read their own service listings"
on public.community_service_listings;


drop policy if exists
  "Listing owners create service listings"
on public.community_service_listings;


drop policy if exists
  "Listing owners update their service listings"
on public.community_service_listings;


drop policy if exists
  "Community moderators read all service listings"
on public.community_service_listings;


create policy
  "Public reads approved service listings"
on public.community_service_listings
for select
to anon, authenticated
using (
  moderation_status = 'approved'
  and published_at is not null
  and archived_at is null
);


create policy
  "Listing owners read their own service listings"
on public.community_service_listings
for select
to authenticated
using (
  owner_user_id = auth.uid()
);


create policy
  "Community moderators read all service listings"
on public.community_service_listings
for select
to authenticated
using (
  private.sm_is_community_service_moderator()
);


create policy
  "Listing owners create service listings"
on public.community_service_listings
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and moderation_status in (
    'draft',
    'submitted'
  )
  and verification_status in (
    'unverified',
    'claimed'
  )
);


create policy
  "Listing owners update their service listings"
on public.community_service_listings
for update
to authenticated
using (
  owner_user_id = auth.uid()
  and moderation_status not in (
    'suspended',
    'archived'
  )
)
with check (
  owner_user_id = auth.uid()
  and moderation_status in (
    'draft',
    'submitted',
    'rejected'
  )
  and verification_status in (
    'unverified',
    'claimed',
    'rejected'
  )
);


revoke all
on public.community_service_listings
from anon, authenticated;


grant select
on public.community_service_listings
to anon, authenticated;


grant insert, update
on public.community_service_listings
to authenticated;


-- ============================================================
-- 7. MODERATION FUNCTION
-- ============================================================

create or replace function
  public.sm_review_community_service_listing(
    p_listing_id uuid,
    p_decision text,
    p_reason text default '',
    p_verification_status text default null,
    p_review_due_at date default null
  )
returns public.community_service_listings
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewed_listing
    public.community_service_listings;
begin
  if auth.uid() is null then
    raise exception
      'Please sign in to continue';
  end if;

  if not private.sm_is_community_service_moderator() then
    raise exception
      'Community directory moderation permission is required';
  end if;

  if p_decision not in (
    'approved',
    'rejected',
    'suspended'
  ) then
    raise exception
      'The moderation decision is not valid';
  end if;

  if p_verification_status is not null
     and p_verification_status not in (
       'unverified',
       'claimed',
       'verified',
       'rejected'
     )
  then
    raise exception
      'The verification status is not valid';
  end if;

  select *
  into reviewed_listing
  from public.community_service_listings listing
  where listing.id = p_listing_id
  for update;

  if reviewed_listing.id is null then
    raise exception
      'The service listing was not found';
  end if;

  if p_decision = 'approved' then
    update public.community_service_listings
    set
      moderation_status = 'approved',
      verification_status =
        coalesce(
          p_verification_status,
          verification_status
        ),
      approved_at = now(),
      published_at = now(),
      review_due_at =
        p_review_due_at,
      archived_at = null
    where id = p_listing_id
    returning *
    into reviewed_listing;
  elsif p_decision = 'rejected' then
    update public.community_service_listings
    set
      moderation_status = 'rejected',
      verification_status =
        coalesce(
          p_verification_status,
          verification_status
        ),
      approved_at = null,
      published_at = null,
      review_due_at =
        p_review_due_at
    where id = p_listing_id
    returning *
    into reviewed_listing;
  else
    update public.community_service_listings
    set
      moderation_status = 'suspended',
      verification_status =
        coalesce(
          p_verification_status,
          verification_status
        ),
      published_at = null,
      review_due_at =
        p_review_due_at
    where id = p_listing_id
    returning *
    into reviewed_listing;
  end if;

  insert into
    public.community_service_listing_reviews (
      listing_id,
      moderator_user_id,
      decision,
      reason,
      verification_status,
      review_due_at
    )
  values (
    p_listing_id,
    auth.uid(),
    p_decision,
    trim(coalesce(p_reason, '')),
    p_verification_status,
    p_review_due_at
  );

  return reviewed_listing;
end;
$$;


revoke all
on function
  public.sm_review_community_service_listing(
    uuid,
    text,
    text,
    text,
    date
  )
from public, anon;


grant execute
on function
  public.sm_review_community_service_listing(
    uuid,
    text,
    text,
    text,
    date
  )
to authenticated;


commit;