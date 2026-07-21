begin;

alter table public.participant_consents
  add column if not exists information_categories text[] not null default '{}',
  add column if not exists permitted_roles text[] not null default '{}',
  add column if not exists consented_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_due_at timestamptz;

alter table public.participant_consents
  drop constraint if exists participant_consents_information_categories_valid;

alter table public.participant_consents
  add constraint participant_consents_information_categories_valid
  check (
    information_categories <@ array[
      'identity','contact','goals','communication','daily_life',
      'support_notes','health','medication','behaviour','financial',
      'documents','photos','other'
    ]::text[]
  );

alter table public.participant_consents
  drop constraint if exists participant_consents_permitted_roles_valid;

alter table public.participant_consents
  add constraint participant_consents_permitted_roles_valid
  check (
    permitted_roles <@ array[
      'participant','nominee','family','support_worker',
      'support_coordinator','professional','circle_manager','circle_member'
    ]::text[]
  );

alter table public.participant_consents
  drop constraint if exists participant_consents_review_dates_valid;

alter table public.participant_consents
  add constraint participant_consents_review_dates_valid
  check (
    review_due_at is null
    or consented_at is null
    or review_due_at > consented_at
  );

create index if not exists
  participant_consents_review_due_at_idx
on public.participant_consents(review_due_at);

create or replace function public.sm_participant_profile_consent_status(
  requested_participant_id uuid,
  requested_circle_id uuid
)
returns table (
  allowed boolean,
  consent_id uuid,
  consent_status text,
  consented_at timestamptz,
  review_due_at timestamptz,
  valid_until timestamptz,
  restrictions text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (
      consent.consent_status = 'active'
      and consent.consented_at is not null
      and (consent.valid_from is null or consent.valid_from <= now())
      and (consent.valid_until is null or consent.valid_until > now())
      and (consent.review_due_at is null or consent.review_due_at > now())
      and consent.withdrawn_at is null
      and coalesce(auth.jwt()->>'aal', '') = 'aal2'
      and private.sm_is_active_circle_member(requested_circle_id)
    ) as allowed,
    consent.id,
    consent.consent_status,
    consent.consented_at,
    consent.review_due_at,
    consent.valid_until,
    consent.restrictions
  from public.participant_consents consent
  where consent.participant_id = requested_participant_id
    and consent.circle_id = requested_circle_id
    and consent.consent_type = 'information_collection'
  order by consent.created_at desc
  limit 1;
$$;

revoke all
on function public.sm_participant_profile_consent_status(uuid, uuid)
from public, anon;

grant execute
on function public.sm_participant_profile_consent_status(uuid, uuid)
to authenticated;

commit;