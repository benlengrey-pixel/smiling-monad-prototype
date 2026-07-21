begin;

-- Circle membership and invitations require a signed-in user,
-- but they do not require MFA.
--
-- Existing Circle membership RLS policies still control who may
-- view, invite, accept, update, or remove members.

drop policy if exists sm_require_aal2
on public.circle_members;

commit;