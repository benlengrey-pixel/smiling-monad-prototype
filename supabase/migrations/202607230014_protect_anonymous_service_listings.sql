-- ============================================================
-- SMILING MONAD
-- Migration 014 — Protect Anonymous Service Listings
--
-- Anonymous visitors may read approved services only through
-- the restricted public view. They can no longer query the
-- underlying service-listings table directly.
--
-- Authenticated access remains temporarily unchanged so private
-- listing, enquiry and moderation workflows continue operating.
-- ============================================================

begin;


-- ============================================================
-- 1. REBUILD THE VIEW AS A CONTROLLED PUBLIC INTERFACE
--
-- The view owner performs the underlying table read.
-- Anonymous visitors receive only the explicitly selected fields
-- and only approved, published, non-archived listings.
-- ============================================================

drop view if exists
  public.community_service_public_listings;


create view
  public.community_service_public_listings
with (
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
  'Controlled public Services Directory interface. Ownership, ABN and internal moderation fields are excluded.';


revoke all
on public.community_service_public_listings
from public, anon, authenticated;


grant select
on public.community_service_public_listings
to anon, authenticated;


-- ============================================================
-- 2. REMOVE ANONYMOUS ACCESS TO THE UNDERLYING TABLE
-- ============================================================

revoke select
on public.community_service_listings
from anon;


-- ============================================================
-- 3. LIMIT THE EXISTING APPROVED-LISTING TABLE POLICY
--
-- Signed-in users retain the existing approved-listing access
-- temporarily because enquiry and provider workflows still use
-- relationships to the underlying table.
-- ============================================================

drop policy if exists
  "Public reads approved service listings"
on public.community_service_listings;


create policy
  "Authenticated people read approved service listings"
on public.community_service_listings
for select
to authenticated
using (
  moderation_status = 'approved'
  and published_at is not null
  and archived_at is null
);


commit;