-- ============================================================
-- SMILING MONAD
-- Migration 012 — Fix Circle Setup Declaration RLS
--
-- Corrects the setup-declaration read policy so an active member
-- can read declarations only for the same Circle.
--
-- No Circle membership or application permissions are expanded.
-- ============================================================

begin;


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
    where member.circle_id =
        circle_setup_declarations.circle_id
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


commit;