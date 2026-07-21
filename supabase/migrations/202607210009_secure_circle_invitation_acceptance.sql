-- ============================================================
-- SMILING MONAD
-- Migration 009 — Secure Circle invitation acceptance
--
-- Allows a signed-in, MFA-verified user to accept only an invitation
-- sent to the email address on their own Supabase account.
-- ============================================================

begin;

create unique index if not exists
  circle_members_unique_open_invitation_per_circle_email_idx
on public.circle_members (
  circle_id,
  lower(invited_email)
)
where
  user_id is null
  and membership_status = 'invited'
  and length(trim(invited_email)) > 0;

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
  current_aal text;
  accepted_member public.circle_members;
begin
  current_user_id := auth.uid();
  current_email := lower(trim(coalesce(auth.jwt()->>'email', '')));
  current_aal := coalesce(auth.jwt()->>'aal', '');

  if current_user_id is null then
    raise exception 'You must be signed in.'
      using errcode = '42501';
  end if;

  if current_aal <> 'aal2' then
    raise exception 'Two-step security is required.'
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
  where member.user_id is null
    and member.membership_status = 'invited'
    and lower(trim(member.invited_email)) =
      lower(trim(coalesce(auth.jwt()->>'email', '')))
    and (
      member.access_starts_at is null
      or member.access_starts_at <= now()
    )
    and (
      member.access_ends_at is null
      or member.access_ends_at > now()
    )
    and auth.uid() is not null
    and coalesce(auth.jwt()->>'aal', '') = 'aal2'
  order by member.invited_at desc;
$$;

revoke all
on function public.sm_list_my_circle_invitations()
from public, anon;

grant execute
on function public.sm_list_my_circle_invitations()
to authenticated;

commit;