-- ============================================================
-- SMILING MONAD
-- Migration 010 — Fix Circle invitation access
--
-- Allows signed-in users to see and accept invitations sent to
-- their own verified email address without requiring MFA/AAL2.
-- ============================================================

begin;

create or replace function public.sm_accept_circle_invitation(
  requested_member_id uuid
)
returns public.circle_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  current_email text;
  accepted_member public.circle_members;
begin
  current_user_id := auth.uid();

  current_email :=
    lower(
      trim(
        coalesce(
          auth.jwt()->>'email',
          ''
        )
      )
    );

  if current_user_id is null then
    raise exception 'You must be signed in.'
      using errcode = '42501';
  end if;

  if current_email = '' then
    raise exception 'Your account does not have a verified email address.'
      using errcode = '42501';
  end if;

  update public.circle_members
  set
    user_id = current_user_id,
    membership_status = 'active',
    accepted_at = now(),
    removed_at = null
  where id = requested_member_id
    and user_id is null
    and membership_status = 'invited'
    and lower(trim(invited_email)) = current_email
    and (
      access_starts_at is null
      or access_starts_at <= now()
    )
    and (
      access_ends_at is null
      or access_ends_at > now()
    )
  returning *
  into accepted_member;

  if accepted_member.id is null then
    raise exception 'No valid Circle invitation was found for this account.'
      using errcode = 'P0002';
  end if;

  return accepted_member;
end;
$$;

revoke all
on function public.sm_accept_circle_invitation(uuid)
from public, anon;

grant execute
on function public.sm_accept_circle_invitation(uuid)
to authenticated;


create or replace function public.sm_list_my_circle_invitations()
returns setof public.circle_members
language sql
stable
security definer
set search_path = ''
as $$
  select member.*
  from public.circle_members member
  where auth.uid() is not null
    and member.user_id is null
    and member.membership_status = 'invited'
    and lower(trim(member.invited_email)) =
      lower(
        trim(
          coalesce(
            auth.jwt()->>'email',
            ''
          )
        )
      )
    and (
      member.access_starts_at is null
      or member.access_starts_at <= now()
    )
    and (
      member.access_ends_at is null
      or member.access_ends_at > now()
    )
  order by member.invited_at desc;
$$;

revoke all
on function public.sm_list_my_circle_invitations()
from public, anon;

grant execute
on function public.sm_list_my_circle_invitations()
to authenticated;

commit;