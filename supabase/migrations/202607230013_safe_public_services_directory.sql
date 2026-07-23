-- ============================================================
-- SMILING MONAD
-- Migration 013 — Safe Public Services Directory
--
-- Adds:
--   • a public-safe service listing view
--   • a public moderator-status RPC wrapper
--   • safe http/https validation for listing websites
--
-- This is a staged hardening migration. The application will be
-- moved to the safe view in the next code step before direct
-- public table access is removed.
-- ============================================================

begin;


-- ============================================================
-- 1. SAFE WEBSITE URL VALIDATION
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname =
      'community_service_listings_website_url_safe'
      and conrelid =
        'public.community_service_listings'::regclass
  ) then
    alter table
      public.community_service_listings
    add constraint
      community_service_listings_website_url_safe
    check (
      website_url = ''
      or website_url ~*
        '^https?://[^\s]+$'
    )
    not valid;
  end if;
end;
$$;


comment on constraint
  community_service_listings_website_url_safe
on public.community_service_listings
is
  'New and updated website URLs must be blank or use http/https. Existing rows are not silently changed.';


-- ============================================================
-- 2. PUBLIC MODERATOR STATUS WRAPPER
--
-- PostgREST exposes public-schema RPC functions. The original
-- private helper remains the source of truth.
-- ============================================================

create or replace function
  public.sm_is_community_service_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.sm_is_community_service_moderator();
$$;


revoke all
on function
  public.sm_is_community_service_moderator()
from public, anon;


grant execute
on function
  public.sm_is_community_service_moderator()
to authenticated;


-- ============================================================
-- 3. PUBLIC-SAFE APPROVED LISTINGS VIEW
--
-- Deliberately excluded:
--   • owner_user_id
--   • ABN
--   • internal moderation status
--   • submission and approval workflow timestamps
--   • archived state
--
-- search_text is retained because it is generated only from
-- information already intended for public directory searching.
-- ============================================================

drop view if exists
  public.community_service_public_listings;


create view
  public.community_service_public_listings
with (
  security_invoker = true,
  security_barrier = true
)
as
select
  listing.id,
  listing.provider_type,
  listing.organisation_name,
  listing.service_name,
  listing.service_category,
  listing.summary,
  listing.description,
  listing.service_areas,
  listing.delivery_methods,
  listing.age_groups,
  listing.accessibility_features,
  listing.languages,
  listing.availability_summary,
  listing.pricing_summary,
  listing.accepts_ndis_funding,
  listing.ndis_registration_status,
  listing.website_url,
  listing.public_email,
  listing.public_phone,
  listing.search_text,
  listing.verification_status,
  listing.published_at,
  listing.review_due_at,
  listing.updated_at
from public.community_service_listings listing
where listing.moderation_status =
    'approved'
  and listing.published_at is not null
  and listing.archived_at is null;


comment on view
  public.community_service_public_listings
is
  'Approved public directory fields only. Private ownership, ABN and moderation workflow fields are excluded.';


revoke all
on public.community_service_public_listings
from public, anon, authenticated;


grant select
on public.community_service_public_listings
to anon, authenticated;


commit;