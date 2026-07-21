-- ============================================================
-- SMILING MONAD
-- Migration 011 — Audited participant profile access
--
-- Adds read-access events to the append-only audit history.
-- A profile access event can only be recorded when:
--   * the user is signed in
--   * the session has MFA assurance level 2
--   * the user is an active Circle member
--   * active information-collection consent exists
-- ============================================================

begin;

alter table public.audit_events
  drop constraint if exists audit_events_action_check;

alter table public.audit_events
  add constraint audit_events_action_check
  check (
    action in (
      'read',
      'insert',
      'update',
      'archive',
      'status_change',
      'permission_change',
      'membership_change',
      'consent_change'
    )
  );

create or replace function public.sm_record_participant_profile_access(
  requested_participant_id uuid,
  requested_circle_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  access_event_id uuid;
  consent_is_active boolean;
begin
  if auth.uid() is null then
    raise exception 'Auth session missing!';
  end if;

  if coalesce(auth.jwt()->>'aal', '') <> 'aal2' then
    raise exception 'Two-step security is required.';
  end if;

  if not private.sm_is_active_circle_member(
    requested_circle_id
  ) then
    raise exception 'Circle access is not authorised.';
  end if;

  select exists (
    select 1
    from public.participant_consents consent
    where consent.participant_id =
      requested_participant_id
      and consent.circle_id =
        requested_circle_id
      and consent.consent_type =
        'information_collection'
      and consent.consent_status =
        'active'
      and consent.consented_at is not null
      and (
        consent.valid_from is null
        or consent.valid_from <= now()
      )
      and (
        consent.valid_until is null
        or consent.valid_until > now()
      )
      and (
        consent.review_due_at is null
        or consent.review_due_at > now()
      )
      and consent.withdrawn_at is null
  )
  into consent_is_active;

  if not consent_is_active then
    raise exception
      'Active privacy consent is required.';
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
    requested_circle_id,
    requested_participant_id,
    auth.uid(),
    'read',
    'participant_profile',
    requested_participant_id,
    array[]::text[],
    'Participant profile opened',
    'application'
  )
  returning id into access_event_id;

  return access_event_id;
end;
$$;

revoke all
on function public.sm_record_participant_profile_access(
  uuid,
  uuid
)
from public, anon;

grant execute
on function public.sm_record_participant_profile_access(
  uuid,
  uuid
)
to authenticated;

commit;