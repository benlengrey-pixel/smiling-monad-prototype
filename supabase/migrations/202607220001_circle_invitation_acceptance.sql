-- ============================================================
-- SMILING MONAD
-- Secure Circle Invitation Acceptance
--
-- Allows a signed-in person to:
--   • see Circle invitations sent to their verified email address
--   • see the name of the Circle they were invited to
--   • accept or decline only their own pending invitation
--
-- Acceptance is performed through a controlled security-definer
-- function so the invitee cannot alter their assigned role,
-- permissions, relationship, inviter, or Circle.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. EMAIL MATCHING HELPER
-- ------------------------------------------------------------

create or replace function private.sm_current_user_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(
    coalesce(
      auth.jwt() ->> 'email',
      ''
    )
  );
$$;

revoke all
on function private.sm_current_user_email()
from public;

grant execute
on function private.sm_current_user_email()
to authenticated;


-- ------------------------------------------------------------
-- 2. INVITEES MAY READ THEIR OWN INVITATION
-- ------------------------------------------------------------

drop policy if exists
  "Invitees read their own pending memberships"
on public.circle_members;

create policy
  "Invitees read their own pending memberships"
on public.circle_members
for select
to authenticated
using (
  membership_status = 'invited'
  and length(trim(invited_email)) > 0
  and lower(trim(invited_email)) =
    private.sm_current_user_email()
);


-- ------------------------------------------------------------
-- 3. INVITEES MAY READ THE INVITED CIRCLE'S BASIC RECORD
-- ------------------------------------------------------------

drop policy if exists
  "Invitees read invited circles"
on public.circles;

create policy
  "Invitees read invited circles"
on public.circles
for select
to authenticated
using (
  exists (
    select 1
    from public.circle_members invited_member
    where invited_member.circle_id = circles.id
      and invited_member.membership_status = 'invited'
      and length(trim(invited_member.invited_email)) > 0
      and lower(trim(invited_member.invited_email)) =
        private.sm_current_user_email()
  )
);


-- ------------------------------------------------------------
-- 4. CONTROLLED ACCEPT / DECLINE FUNCTION
-- ------------------------------------------------------------

create or replace function public.respond_to_circle_invitation(
  invitation_id uuid,
  invitation_response text
)
returns public.circle_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  current_email text;
  invitation public.circle_members;
  updated_invitation public.circle_members;
begin
  current_user_id := auth.uid();
  current_email := private.sm_current_user_email();

  if current_user_id is null then
    raise exception
      'You must be signed in to respond to a Circle invitation.';
  end if;

  if current_email = '' then
    raise exception
      'Your signed-in account does not have a verified email address.';
  end if;

  if invitation_response not in ('accept', 'decline') then
    raise exception
      'Invitation response must be accept or decline.';
  end if;

  select *
  into invitation
  from public.circle_members
  where id = invitation_id
  for update;

  if not found then
    raise exception
      'This Circle invitation could not be found.';
  end if;

  if invitation.membership_status <> 'invited' then
    raise exception
      'This Circle invitation has already been answered.';
  end if;

  if lower(trim(invitation.invited_email)) <> current_email then
    raise exception
      'This Circle invitation belongs to a different email address.';
  end if;

  if invitation_response = 'accept' then
    if exists (
      select 1
      from public.circle_members existing_member
      where existing_member.circle_id = invitation.circle_id
        and existing_member.user_id = current_user_id
        and existing_member.id <> invitation.id
        and existing_member.membership_status <> 'removed'
    ) then
      raise exception
        'Your account already belongs to this Circle.';
    end if;

    update public.circle_members
    set
      user_id = current_user_id,
      membership_status = 'active',
      accepted_at = now(),
      removed_at = null
    where id = invitation.id
    returning *
    into updated_invitation;
  else
    update public.circle_members
    set
      user_id = current_user_id,
      membership_status = 'declined',
      accepted_at = null
    where id = invitation.id
    returning *
    into updated_invitation;
  end if;

  return updated_invitation;
end;
$$;

revoke all
on function public.respond_to_circle_invitation(uuid, text)
from public;

grant execute
on function public.respond_to_circle_invitation(uuid, text)
to authenticated;

commit;