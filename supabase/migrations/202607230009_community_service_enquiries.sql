-- ============================================================
-- SMILING MONAD
-- Migration 009 — Community Service Enquiries and Circle Saves
--
-- Creates:
--   • private in-app enquiries to approved service listings
--   • provider responses without exposing other users' enquiries
--   • secure saving and sharing of directory services to a Circle
--
-- Privacy:
--   • enquiries are visible only to the sender and listing owner
--   • contact details are shared only when the sender submits them
--   • no participant profile content is copied into an enquiry
--   • Circle saves are visible only to active members of that Circle
--   • no delete privileges are granted; records are closed or archived
-- ============================================================

begin;


-- ============================================================
-- 1. PRIVATE SERVICE ENQUIRIES
-- ============================================================

create table if not exists
  public.community_service_enquiries (
    id uuid primary key
      default gen_random_uuid(),

    listing_id uuid not null
      references public.community_service_listings(id)
      on delete restrict,

    sender_user_id uuid not null
      references auth.users(id)
      on delete restrict,

    subject text not null,
    message text not null,

    contact_name text not null
      default '',

    contact_email text not null
      default '',

    contact_phone text not null
      default '',

    preferred_contact_method text not null
      default 'platform'
      check (
        preferred_contact_method in (
          'platform',
          'email',
          'phone'
        )
      ),

    consent_to_share_contact boolean not null
      default false,

    enquiry_status text not null
      default 'submitted'
      check (
        enquiry_status in (
          'submitted',
          'read',
          'responded',
          'closed',
          'withdrawn'
        )
      ),

    provider_response text not null
      default '',

    responded_by uuid
      references auth.users(id)
      on delete restrict,

    responded_at timestamptz,
    closed_at timestamptz,
    withdrawn_at timestamptz,

    created_at timestamptz not null
      default now(),

    updated_at timestamptz not null
      default now(),

    constraint
      community_service_enquiries_contact_email_valid
      check (
        contact_email = ''
        or contact_email ~*
          '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
      ),

    constraint
      community_service_enquiries_contact_consent_valid
      check (
        preferred_contact_method = 'platform'
        or consent_to_share_contact = true
      ),

    constraint
      community_service_enquiries_contact_value_valid
      check (
        preferred_contact_method = 'platform'
        or (
          preferred_contact_method = 'email'
          and contact_email <> ''
        )
        or (
          preferred_contact_method = 'phone'
          and contact_phone <> ''
        )
      )
  );


create index if not exists
  community_service_enquiries_listing_idx
on public.community_service_enquiries(
  listing_id,
  created_at desc
);


create index if not exists
  community_service_enquiries_sender_idx
on public.community_service_enquiries(
  sender_user_id,
  created_at desc
);


create index if not exists
  community_service_enquiries_status_idx
on public.community_service_enquiries(
  enquiry_status
);


drop trigger if exists
  community_service_enquiries_set_updated_at
on public.community_service_enquiries;


create trigger
  community_service_enquiries_set_updated_at
before update
on public.community_service_enquiries
for each row
execute function private.sm_set_updated_at();


-- ============================================================
-- 2. ENQUIRY VALIDATION
-- ============================================================

create or replace function
  private.sm_validate_community_service_enquiry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.subject :=
    trim(new.subject);

  new.message :=
    trim(new.message);

  new.contact_name :=
    trim(new.contact_name);

  new.contact_email :=
    lower(trim(new.contact_email));

  new.contact_phone :=
    trim(new.contact_phone);

  new.provider_response :=
    trim(new.provider_response);

  if length(new.subject) < 3 then
    raise exception
      'The enquiry subject must contain at least 3 characters';
  end if;

  if length(new.message) < 20 then
    raise exception
      'The enquiry message must contain at least 20 characters';
  end if;

  if not exists (
    select 1
    from public.community_service_listings listing
    where listing.id = new.listing_id
      and listing.moderation_status = 'approved'
      and listing.published_at is not null
      and listing.archived_at is null
  ) then
    raise exception
      'Enquiries can only be sent to an approved service listing';
  end if;

  if tg_op = 'INSERT' then
    new.sender_user_id := auth.uid();
    new.enquiry_status := 'submitted';
    new.provider_response := '';
    new.responded_by := null;
    new.responded_at := null;
    new.closed_at := null;
    new.withdrawn_at := null;
  end if;

  if new.enquiry_status = 'responded'
     and new.responded_at is null
  then
    new.responded_at := now();
  end if;

  if new.enquiry_status = 'closed'
     and new.closed_at is null
  then
    new.closed_at := now();
  elsif new.enquiry_status <> 'closed' then
    new.closed_at := null;
  end if;

  if new.enquiry_status = 'withdrawn'
     and new.withdrawn_at is null
  then
    new.withdrawn_at := now();
  elsif new.enquiry_status <> 'withdrawn' then
    new.withdrawn_at := null;
  end if;

  return new;
end;
$$;


revoke all
on function
  private.sm_validate_community_service_enquiry()
from public, anon;


drop trigger if exists
  community_service_enquiries_validate
on public.community_service_enquiries;


create trigger
  community_service_enquiries_validate
before insert or update
on public.community_service_enquiries
for each row
execute function
  private.sm_validate_community_service_enquiry();


-- ============================================================
-- 3. ENQUIRY ACCESS
-- ============================================================

alter table
  public.community_service_enquiries
enable row level security;


drop policy if exists
  "People read their own service enquiries"
on public.community_service_enquiries;


drop policy if exists
  "Listing owners read enquiries sent to them"
on public.community_service_enquiries;


drop policy if exists
  "Signed in people create service enquiries"
on public.community_service_enquiries;


create policy
  "People read their own service enquiries"
on public.community_service_enquiries
for select
to authenticated
using (
  sender_user_id = auth.uid()
);


create policy
  "Listing owners read enquiries sent to them"
on public.community_service_enquiries
for select
to authenticated
using (
  exists (
    select 1
    from public.community_service_listings listing
    where listing.id = listing_id
      and listing.owner_user_id = auth.uid()
  )
);


create policy
  "Signed in people create service enquiries"
on public.community_service_enquiries
for insert
to authenticated
with check (
  sender_user_id = auth.uid()
);


revoke all
on public.community_service_enquiries
from anon, authenticated;


grant select, insert
on public.community_service_enquiries
to authenticated;


-- ============================================================
-- 4. PROVIDER RESPONSE FUNCTION
-- ============================================================

create or replace function
  public.sm_respond_to_community_service_enquiry(
    p_enquiry_id uuid,
    p_response text,
    p_close boolean default false
  )
returns public.community_service_enquiries
language plpgsql
security definer
set search_path = ''
as $$
declare
  enquiry_record
    public.community_service_enquiries;
begin
  if auth.uid() is null then
    raise exception
      'Please sign in to continue';
  end if;

  select enquiry.*
  into enquiry_record
  from public.community_service_enquiries enquiry
  join public.community_service_listings listing
    on listing.id = enquiry.listing_id
  where enquiry.id = p_enquiry_id
    and listing.owner_user_id = auth.uid()
  for update of enquiry;

  if enquiry_record.id is null then
    raise exception
      'The service enquiry was not found or you do not own the listing';
  end if;

  if enquiry_record.enquiry_status in (
    'withdrawn',
    'closed'
  ) then
    raise exception
      'This service enquiry is no longer open';
  end if;

  if length(trim(coalesce(p_response, ''))) < 3 then
    raise exception
      'A provider response is required';
  end if;

  update public.community_service_enquiries
  set
    provider_response =
      trim(p_response),
    responded_by = auth.uid(),
    responded_at = now(),
    enquiry_status =
      case
        when p_close then 'closed'
        else 'responded'
      end,
    closed_at =
      case
        when p_close then now()
        else null
      end
  where id = p_enquiry_id
  returning *
  into enquiry_record;

  return enquiry_record;
end;
$$;


revoke all
on function
  public.sm_respond_to_community_service_enquiry(
    uuid,
    text,
    boolean
  )
from public, anon;


grant execute
on function
  public.sm_respond_to_community_service_enquiry(
    uuid,
    text,
    boolean
  )
to authenticated;


-- ============================================================
-- 5. SENDER WITHDRAWAL FUNCTION
-- ============================================================

create or replace function
  public.sm_withdraw_community_service_enquiry(
    p_enquiry_id uuid
  )
returns public.community_service_enquiries
language plpgsql
security definer
set search_path = ''
as $$
declare
  enquiry_record
    public.community_service_enquiries;
begin
  if auth.uid() is null then
    raise exception
      'Please sign in to continue';
  end if;

  select *
  into enquiry_record
  from public.community_service_enquiries
  where id = p_enquiry_id
    and sender_user_id = auth.uid()
  for update;

  if enquiry_record.id is null then
    raise exception
      'The service enquiry was not found';
  end if;

  if enquiry_record.enquiry_status in (
    'closed',
    'withdrawn'
  ) then
    return enquiry_record;
  end if;

  update public.community_service_enquiries
  set
    enquiry_status = 'withdrawn',
    withdrawn_at = now()
  where id = p_enquiry_id
  returning *
  into enquiry_record;

  return enquiry_record;
end;
$$;


revoke all
on function
  public.sm_withdraw_community_service_enquiry(uuid)
from public, anon;


grant execute
on function
  public.sm_withdraw_community_service_enquiry(uuid)
to authenticated;


-- ============================================================
-- 6. CIRCLE SERVICE SAVES
-- ============================================================

create table if not exists
  public.community_service_circle_saves (
    id uuid primary key
      default gen_random_uuid(),

    listing_id uuid not null
      references public.community_service_listings(id)
      on delete restrict,

    circle_id uuid not null
      references public.circles(id)
      on delete restrict,

    participant_id uuid not null
      references public.participants(id)
      on delete restrict,

    shared_by uuid not null
      references auth.users(id)
      on delete restrict,

    note text not null
      default '',

    archived_at timestamptz,

    created_at timestamptz not null
      default now(),

    updated_at timestamptz not null
      default now(),

    constraint
      community_service_circle_saves_unique
      unique (
        listing_id,
        circle_id
      )
  );


create index if not exists
  community_service_circle_saves_circle_idx
on public.community_service_circle_saves(
  circle_id,
  created_at desc
);


create index if not exists
  community_service_circle_saves_listing_idx
on public.community_service_circle_saves(
  listing_id
);


drop trigger if exists
  community_service_circle_saves_set_updated_at
on public.community_service_circle_saves;


create trigger
  community_service_circle_saves_set_updated_at
before update
on public.community_service_circle_saves
for each row
execute function private.sm_set_updated_at();


-- ============================================================
-- 7. ACTIVE CIRCLE MEMBER CHECK
-- ============================================================

create or replace function
  private.sm_can_access_community_service_circle_save(
    p_circle_id uuid
  )
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.sm_is_circle_creator(p_circle_id)
    or exists (
      select 1
      from public.circle_members member
      where member.circle_id = p_circle_id
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


revoke all
on function
  private.sm_can_access_community_service_circle_save(uuid)
from public, anon;


grant execute
on function
  private.sm_can_access_community_service_circle_save(uuid)
to authenticated;


-- ============================================================
-- 8. CIRCLE SAVE VALIDATION
-- ============================================================

create or replace function
  private.sm_validate_community_service_circle_save()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.note := trim(new.note);

  if not exists (
    select 1
    from public.community_service_listings listing
    where listing.id = new.listing_id
      and listing.moderation_status = 'approved'
      and listing.published_at is not null
      and listing.archived_at is null
  ) then
    raise exception
      'Only approved services can be saved to a Circle';
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
      'The selected Circle does not belong to this participant';
  end if;

  if not private.sm_can_access_community_service_circle_save(
    new.circle_id
  ) then
    raise exception
      'Active Circle membership is required';
  end if;

  if tg_op = 'INSERT' then
    new.shared_by := auth.uid();
    new.archived_at := null;
  end if;

  return new;
end;
$$;


revoke all
on function
  private.sm_validate_community_service_circle_save()
from public, anon;


drop trigger if exists
  community_service_circle_saves_validate
on public.community_service_circle_saves;


create trigger
  community_service_circle_saves_validate
before insert or update
on public.community_service_circle_saves
for each row
execute function
  private.sm_validate_community_service_circle_save();


-- ============================================================
-- 9. CIRCLE SAVE ACCESS
-- ============================================================

alter table
  public.community_service_circle_saves
enable row level security;


drop policy if exists
  "Active Circle members read saved services"
on public.community_service_circle_saves;


drop policy if exists
  "Active Circle members save services"
on public.community_service_circle_saves;


create policy
  "Active Circle members read saved services"
on public.community_service_circle_saves
for select
to authenticated
using (
  private.sm_can_access_community_service_circle_save(
    circle_id
  )
);


create policy
  "Active Circle members save services"
on public.community_service_circle_saves
for insert
to authenticated
with check (
  shared_by = auth.uid()
  and private.sm_can_access_community_service_circle_save(
    circle_id
  )
);


revoke all
on public.community_service_circle_saves
from anon, authenticated;


grant select, insert
on public.community_service_circle_saves
to authenticated;


-- ============================================================
-- 10. SAVE OR RESTORE SERVICE TO CIRCLE
-- ============================================================

create or replace function
  public.sm_save_community_service_to_circle(
    p_listing_id uuid,
    p_circle_id uuid,
    p_participant_id uuid,
    p_note text default ''
  )
returns public.community_service_circle_saves
language plpgsql
security definer
set search_path = ''
as $$
declare
  save_record
    public.community_service_circle_saves;
begin
  if auth.uid() is null then
    raise exception
      'Please sign in to continue';
  end if;

  if not private.sm_can_access_community_service_circle_save(
    p_circle_id
  ) then
    raise exception
      'Active Circle membership is required';
  end if;

  insert into
    public.community_service_circle_saves (
      listing_id,
      circle_id,
      participant_id,
      shared_by,
      note,
      archived_at
    )
  values (
    p_listing_id,
    p_circle_id,
    p_participant_id,
    auth.uid(),
    trim(coalesce(p_note, '')),
    null
  )
  on conflict (
    listing_id,
    circle_id
  )
  do update
  set
    note = excluded.note,
    shared_by = auth.uid(),
    archived_at = null,
    updated_at = now()
  returning *
  into save_record;

  return save_record;
end;
$$;


revoke all
on function
  public.sm_save_community_service_to_circle(
    uuid,
    uuid,
    uuid,
    text
  )
from public, anon;


grant execute
on function
  public.sm_save_community_service_to_circle(
    uuid,
    uuid,
    uuid,
    text
  )
to authenticated;


-- ============================================================
-- 11. REMOVE SERVICE FROM CIRCLE
-- ============================================================

create or replace function
  public.sm_remove_community_service_from_circle(
    p_save_id uuid
  )
returns public.community_service_circle_saves
language plpgsql
security definer
set search_path = ''
as $$
declare
  save_record
    public.community_service_circle_saves;
begin
  if auth.uid() is null then
    raise exception
      'Please sign in to continue';
  end if;

  select *
  into save_record
  from public.community_service_circle_saves
  where id = p_save_id
  for update;

  if save_record.id is null then
    raise exception
      'The saved Circle service was not found';
  end if;

  if not private.sm_can_access_community_service_circle_save(
    save_record.circle_id
  ) then
    raise exception
      'Active Circle membership is required';
  end if;

  update public.community_service_circle_saves
  set archived_at = now()
  where id = p_save_id
  returning *
  into save_record;

  return save_record;
end;
$$;


revoke all
on function
  public.sm_remove_community_service_from_circle(uuid)
from public, anon;


grant execute
on function
  public.sm_remove_community_service_from_circle(uuid)
to authenticated;


commit;