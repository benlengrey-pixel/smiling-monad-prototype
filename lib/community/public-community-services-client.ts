"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CommunityServiceDirectoryFilters,
  CommunityServiceListing,
} from "@/lib/community/secure-community-services-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PublicCommunityServiceListingRow = {
  id: string;
  provider_type:
    CommunityServiceListing["provider_type"];
  organisation_name: string;
  service_name: string;
  service_category:
    CommunityServiceListing["service_category"];
  summary: string;
  description: string;
  service_areas: string[];
  delivery_methods:
    CommunityServiceListing["delivery_methods"];
  age_groups:
    CommunityServiceListing["age_groups"];
  accessibility_features: string[];
  languages: string[];
  availability_summary: string;
  pricing_summary: string;
  accepts_ndis_funding: boolean;
  ndis_registration_status:
    CommunityServiceListing["ndis_registration_status"];
  website_url: string;
  public_email: string;
  public_phone: string;
  search_text: string;
  verification_status:
    CommunityServiceListing["verification_status"];
  published_at: string;
  review_due_at: string | null;
  updated_at: string;
};

const PUBLIC_LISTINGS_VIEW =
  "community_service_public_listings";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getClient(): SupabaseClient {
  return getSupabaseBrowserClient();
}

function cleanLimit(
  value: number | undefined,
): number {
  if (!Number.isFinite(value)) {
    return 50;
  }

  return Math.max(
    1,
    Math.min(
      Math.floor(value ?? 50),
      100,
    ),
  );
}

function cleanSearchQuery(
  value: string | undefined,
): string {
  return (
    value
      ?.replace(
        /[%_\u0000-\u001f\u007f]/g,
        " ",
      )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) ?? ""
  );
}

function requiredUuid(
  value: string,
  label: string,
): string {
  const clean = value.trim();

  if (!UUID_PATTERN.test(clean)) {
    throw new Error(
      `${label} is not valid.`,
    );
  }

  return clean;
}

function safePublicWebsiteUrl(
  value: string,
): string {
  const clean = value.trim();

  if (!clean) {
    return "";
  }

  try {
    const parsed = new URL(clean);

    if (
      parsed.protocol !== "https:" &&
      parsed.protocol !== "http:"
    ) {
      return "";
    }

    return parsed.toString();
  } catch {
    return "";
  }
}

function describePublicDirectoryError(
  error: unknown,
  fallback: string,
): Error {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const candidate = error as {
      message?: unknown;
      code?: unknown;
    };

    if (
      candidate.code === "42501"
    ) {
      return new Error(
        "The public Services Directory is not available.",
      );
    }
  }

  return new Error(fallback);
}

function toCompatiblePublicListing(
  row: PublicCommunityServiceListingRow,
): CommunityServiceListing {
  return {
    id: row.id,

    /*
     * These private workflow fields are deliberately
     * absent from the public database view.
     *
     * Blank local compatibility values prevent the
     * existing directory UI from receiving private
     * ownership or moderation information.
     */
    owner_user_id: "",

    provider_type:
      row.provider_type,

    organisation_name:
      row.organisation_name,

    service_name:
      row.service_name,

    service_category:
      row.service_category,

    summary:
      row.summary,

    description:
      row.description,

    service_areas:
      row.service_areas ?? [],

    delivery_methods:
      row.delivery_methods ?? [],

    age_groups:
      row.age_groups ?? [],

    accessibility_features:
      row.accessibility_features ?? [],

    languages:
      row.languages ?? [],

    availability_summary:
      row.availability_summary,

    pricing_summary:
      row.pricing_summary,

    accepts_ndis_funding:
      row.accepts_ndis_funding,

    ndis_registration_status:
      row.ndis_registration_status,

    abn: "",

    website_url:
      safePublicWebsiteUrl(
        row.website_url,
      ),

    public_email:
      row.public_email,

    public_phone:
      row.public_phone,

    search_text:
      row.search_text,

    verification_status:
      row.verification_status,

    moderation_status:
      "approved",

    submitted_at: null,
    approved_at: null,

    published_at:
      row.published_at,

    review_due_at:
      row.review_due_at,

    archived_at: null,

    created_at:
      row.updated_at,

    updated_at:
      row.updated_at,
  };
}

export async function readSafeApprovedCommunityServiceListings(
  filters:
    CommunityServiceDirectoryFilters = {},
): Promise<CommunityServiceListing[]> {
  const supabase = getClient();

  let query = supabase
    .from(PUBLIC_LISTINGS_VIEW)
    .select("*")
    .order(
      "service_name",
      {
        ascending: true,
      },
    )
    .limit(
      cleanLimit(filters.limit),
    );

  const searchQuery =
    cleanSearchQuery(
      filters.query,
    );

  if (searchQuery) {
    query = query.ilike(
      "search_text",
      `%${searchQuery}%`,
    );
  }

  if (filters.providerType) {
    query = query.eq(
      "provider_type",
      filters.providerType,
    );
  }

  if (filters.category) {
    query = query.eq(
      "service_category",
      filters.category,
    );
  }

  if (
    filters.serviceArea?.trim()
  ) {
    query = query.contains(
      "service_areas",
      [
        filters.serviceArea
          .trim()
          .slice(0, 120),
      ],
    );
  }

  if (filters.deliveryMethod) {
    query = query.contains(
      "delivery_methods",
      [filters.deliveryMethod],
    );
  }

  if (filters.ageGroup) {
    query = query.contains(
      "age_groups",
      [filters.ageGroup],
    );
  }

  if (
    filters.acceptsNdisFunding ===
    true
  ) {
    query = query.eq(
      "accepts_ndis_funding",
      true,
    );
  }

  if (
    filters.ndisRegistrationStatus
  ) {
    query = query.eq(
      "ndis_registration_status",
      filters.ndisRegistrationStatus,
    );
  }

  if (filters.verifiedOnly) {
    query = query.eq(
      "verification_status",
      "verified",
    );
  }

  const { data, error } =
    await query;

  if (error) {
    throw describePublicDirectoryError(
      error,
      "The Services Directory could not be loaded.",
    );
  }

  return (
    (data ?? []) as
      PublicCommunityServiceListingRow[]
  ).map(
    toCompatiblePublicListing,
  );
}

export async function readSafePublicCommunityServiceListing(
  listingId: string,
): Promise<CommunityServiceListing | null> {
  const supabase = getClient();

  const { data, error } =
    await supabase
      .from(PUBLIC_LISTINGS_VIEW)
      .select("*")
      .eq(
        "id",
        requiredUuid(
          listingId,
          "Service listing",
        ),
      )
      .maybeSingle();

  if (error) {
    throw describePublicDirectoryError(
      error,
      "The service listing could not be loaded.",
    );
  }

  return data
    ? toCompatiblePublicListing(
        data as PublicCommunityServiceListingRow,
      )
    : null;
}