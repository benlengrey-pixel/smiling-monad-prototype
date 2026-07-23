"use client";

import type {
  SupabaseClient,
  User,
} from "@supabase/supabase-js";

import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

export type CommunityServiceProviderType =
  | "individual"
  | "organisation"
  | "community_group"
  | "business";

export type CommunityServiceCategory =
  | "support_work"
  | "support_coordination"
  | "allied_health"
  | "therapy"
  | "community_access"
  | "transport"
  | "respite"
  | "housing"
  | "employment"
  | "education_training"
  | "plan_management"
  | "assistive_technology"
  | "advocacy"
  | "social_group"
  | "health_wellbeing"
  | "disability_friendly_business"
  | "other";

export type CommunityServiceDeliveryMethod =
  | "in_person"
  | "online"
  | "phone"
  | "home_visit"
  | "community"
  | "group"
  | "other";

export type CommunityServiceAgeGroup =
  | "children"
  | "teenagers"
  | "young_adults"
  | "adults"
  | "older_people"
  | "all_ages";

export type CommunityServiceNdisRegistrationStatus =
  | "registered"
  | "unregistered"
  | "not_applicable"
  | "not_stated";

export type CommunityServiceVerificationStatus =
  | "unverified"
  | "claimed"
  | "verified"
  | "rejected";

export type CommunityServiceModerationStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "suspended"
  | "archived";

export type CommunityServiceReviewDecision =
  | "approved"
  | "rejected"
  | "suspended";

export type CommunityServicePreferredContactMethod =
  | "platform"
  | "email"
  | "phone";

export type CommunityServiceEnquiryStatus =
  | "submitted"
  | "read"
  | "responded"
  | "closed"
  | "withdrawn";

export type CommunityServiceListing = {
  id: string;
  owner_user_id: string;
  provider_type:
    CommunityServiceProviderType;
  organisation_name: string;
  service_name: string;
  service_category:
    CommunityServiceCategory;
  summary: string;
  description: string;
  service_areas: string[];
  delivery_methods:
    CommunityServiceDeliveryMethod[];
  age_groups:
    CommunityServiceAgeGroup[];
  accessibility_features: string[];
  languages: string[];
  availability_summary: string;
  pricing_summary: string;
  accepts_ndis_funding: boolean;
  ndis_registration_status:
    CommunityServiceNdisRegistrationStatus;
  abn: string;
  website_url: string;
  public_email: string;
  public_phone: string;
  search_text: string;
  verification_status:
    CommunityServiceVerificationStatus;
  moderation_status:
    CommunityServiceModerationStatus;
  submitted_at: string | null;
  approved_at: string | null;
  published_at: string | null;
  review_due_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CommunityServiceListingReview = {
  id: string;
  listing_id: string;
  moderator_user_id: string;
  decision:
    CommunityServiceReviewDecision;
  reason: string;
  verification_status:
    CommunityServiceVerificationStatus | null;
  review_due_at: string | null;
  created_at: string;
};

export type CommunityServiceEnquiry = {
  id: string;
  listing_id: string;
  sender_user_id: string;
  subject: string;
  message: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  preferred_contact_method:
    CommunityServicePreferredContactMethod;
  consent_to_share_contact: boolean;
  enquiry_status:
    CommunityServiceEnquiryStatus;
  provider_response: string;
  responded_by: string | null;
  responded_at: string | null;
  closed_at: string | null;
  withdrawn_at: string | null;
  created_at: string;
  updated_at: string;
  community_service_listings?:
    | Pick<
        CommunityServiceListing,
        | "id"
        | "service_name"
        | "organisation_name"
        | "owner_user_id"
      >
    | null;
};

export type CommunityServiceCircleSave = {
  id: string;
  listing_id: string;
  circle_id: string;
  participant_id: string;
  shared_by: string;
  note: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  community_service_listings?:
    | CommunityServiceListing
    | null;
};

export type CommunityServiceEnquiryInput = {
  listingId: string;
  subject: string;
  message: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  preferredContactMethod?:
    CommunityServicePreferredContactMethod;
  consentToShareContact?: boolean;
};

export type CommunityServiceEnquiryResponseInput = {
  enquiryId: string;
  response: string;
  close?: boolean;
};

export type CommunityServiceCircleSaveInput = {
  listingId: string;
  circleId: string;
  participantId: string;
  note?: string;
};

export type CommunityServiceListingInput = {
  providerType:
    CommunityServiceProviderType;
  organisationName: string;
  serviceName: string;
  serviceCategory:
    CommunityServiceCategory;
  summary: string;
  description: string;
  serviceAreas: string[];
  deliveryMethods:
    CommunityServiceDeliveryMethod[];
  ageGroups:
    CommunityServiceAgeGroup[];
  accessibilityFeatures?: string[];
  languages?: string[];
  availabilitySummary?: string;
  pricingSummary?: string;
  acceptsNdisFunding?: boolean;
  ndisRegistrationStatus?:
    CommunityServiceNdisRegistrationStatus;
  abn?: string;
  websiteUrl?: string;
  publicEmail?: string;
  publicPhone?: string;
};

export type CommunityServiceDirectoryFilters = {
  query?: string;
  providerType?:
    CommunityServiceProviderType | "";
  category?:
    CommunityServiceCategory | "";
  serviceArea?: string;
  deliveryMethod?:
    CommunityServiceDeliveryMethod | "";
  ageGroup?:
    CommunityServiceAgeGroup | "";
  acceptsNdisFunding?: boolean;
  ndisRegistrationStatus?:
    CommunityServiceNdisRegistrationStatus | "";
  verifiedOnly?: boolean;
  limit?: number;
};

export type ReviewCommunityServiceListingInput = {
  listingId: string;
  decision:
    CommunityServiceReviewDecision;
  reason?: string;
  verificationStatus?:
    CommunityServiceVerificationStatus | null;
  reviewDueAt?: string | null;
};

function getClient(): SupabaseClient {
  return getSupabaseBrowserClient();
}

function requiredText(
  value: string,
  label: string,
): string {
  const clean = value.trim();

  if (!clean) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return clean;
}

function cleanTextArray(
  values: string[] | undefined,
): string[] {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) =>
          value.trim(),
        )
        .filter(Boolean),
    ),
  );
}

function cleanLimit(
  value: number | undefined,
): number {
  if (
    !Number.isFinite(value)
  ) {
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

function optionalDate(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(
    `${value.trim()}T12:00:00`,
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    throw new Error(
      "Review due date is not valid.",
    );
  }

  return value.trim();
}

async function requireUser(
  supabase: SupabaseClient,
): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      "Please sign in to continue.",
    );
  }

  return user;
}

function friendlyDirectoryError(
  error: unknown,
  fallback: string,
): Error {
  if (error instanceof Error) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null
  ) {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const message =
      typeof candidate.message ===
        "string"
        ? candidate.message
        : "";

    const details =
      typeof candidate.details ===
        "string"
        ? candidate.details
        : "";

    const hint =
      typeof candidate.hint ===
        "string"
        ? candidate.hint
        : "";

    const combined = [
      message,
      details,
      hint,
    ]
      .join(" ")
      .toLowerCase();

    if (
      combined.includes(
        "row-level security",
      ) ||
      combined.includes(
        "permission denied",
      ) ||
      candidate.code === "42501"
    ) {
      return new Error(
        "You do not have permission to perform this Services Directory action.",
      );
    }

    if (
      combined.includes(
        "moderation permission",
      )
    ) {
      return new Error(
        "Community directory moderation permission is required.",
      );
    }

    if (
      combined.includes(
        "public_email",
      ) ||
      combined.includes(
        "email_valid",
      )
    ) {
      return new Error(
        "Enter a valid public email address or leave it blank.",
      );
    }

    const parts = [
      message,
      details,
      hint,
      candidate.code
        ? `Code: ${String(
            candidate.code,
          )}`
        : "",
    ].filter(Boolean);

    if (parts.length > 0) {
      return new Error(
        parts.join(" "),
      );
    }
  }

  return new Error(fallback);
}

function listingPayload(
  input:
    CommunityServiceListingInput,
) {
  const serviceAreas =
    cleanTextArray(
      input.serviceAreas,
    );

  if (
    serviceAreas.length === 0
  ) {
    throw new Error(
      "At least one service area is required.",
    );
  }

  if (
    input.deliveryMethods.length ===
    0
  ) {
    throw new Error(
      "At least one delivery method is required.",
    );
  }

  if (
    input.ageGroups.length === 0
  ) {
    throw new Error(
      "At least one age group is required.",
    );
  }

  return {
    provider_type:
      input.providerType,

    organisation_name:
      requiredText(
        input.organisationName,
        "Organisation or provider name",
      ),

    service_name:
      requiredText(
        input.serviceName,
        "Service name",
      ),

    service_category:
      input.serviceCategory,

    summary:
      requiredText(
        input.summary,
        "Service summary",
      ),

    description:
      requiredText(
        input.description,
        "Service description",
      ),

    service_areas:
      serviceAreas,

    delivery_methods:
      Array.from(
        new Set(
          input.deliveryMethods,
        ),
      ),

    age_groups:
      Array.from(
        new Set(
          input.ageGroups,
        ),
      ),

    accessibility_features:
      cleanTextArray(
        input.accessibilityFeatures,
      ),

    languages:
      cleanTextArray(
        input.languages,
      ).length > 0
        ? cleanTextArray(
            input.languages,
          )
        : ["English"],

    availability_summary:
      input.availabilitySummary?.trim() ??
      "",

    pricing_summary:
      input.pricingSummary?.trim() ??
      "",

    accepts_ndis_funding:
      input.acceptsNdisFunding === true,

    ndis_registration_status:
      input.ndisRegistrationStatus ??
      "not_stated",

    abn:
      input.abn?.trim() ?? "",

    website_url:
      input.websiteUrl?.trim() ??
      "",

    public_email:
      input.publicEmail?.trim() ??
      "",

    public_phone:
      input.publicPhone?.trim() ??
      "",
  };
}

export async function readApprovedCommunityServiceListings(
  filters:
    CommunityServiceDirectoryFilters = {},
): Promise<CommunityServiceListing[]> {
  const supabase = getClient();

  let query = supabase
    .from(
      "community_service_listings",
    )
    .select("*")
    .eq(
      "moderation_status",
      "approved",
    )
    .not(
      "published_at",
      "is",
      null,
    )
    .is("archived_at", null)
    .order("service_name", {
      ascending: true,
    })
    .limit(
      cleanLimit(filters.limit),
    );

  const cleanQuery =
    filters.query?.trim();

  if (cleanQuery) {
    query = query.ilike(
      "search_text",
      `%${cleanQuery}%`,
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
        filters.serviceArea.trim(),
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
    throw friendlyDirectoryError(
      error,
      "The Services Directory could not be loaded.",
    );
  }

  return (
    data ?? []
  ) as unknown as CommunityServiceListing[];
}

export async function readCommunityServiceListing(
  listingId: string,
): Promise<CommunityServiceListing | null> {
  const supabase = getClient();

  const { data, error } =
    await supabase
      .from(
        "community_service_listings",
      )
      .select("*")
      .eq(
        "id",
        requiredText(
          listingId,
          "Service listing",
        ),
      )
      .maybeSingle();

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The service listing could not be loaded.",
    );
  }

  return data
    ? data as unknown as CommunityServiceListing
    : null;
}

export async function readMyCommunityServiceListings():
  Promise<CommunityServiceListing[]> {
  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  const { data, error } =
    await supabase
      .from(
        "community_service_listings",
      )
      .select("*")
      .eq(
        "owner_user_id",
        user.id,
      )
      .order("updated_at", {
        ascending: false,
      });

  if (error) {
    throw friendlyDirectoryError(
      error,
      "Your service listings could not be loaded.",
    );
  }

  return (
    data ?? []
  ) as unknown as CommunityServiceListing[];
}

export async function createCommunityServiceListing(
  input:
    CommunityServiceListingInput,
  submitForReview = false,
): Promise<CommunityServiceListing> {
  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  const { data, error } =
    await supabase
      .from(
        "community_service_listings",
      )
      .insert({
        owner_user_id:
          user.id,

        ...listingPayload(
          input,
        ),

        moderation_status:
          submitForReview
            ? "submitted"
            : "draft",

        verification_status:
          "unverified",
      })
      .select("*")
      .single();

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The service listing could not be created.",
    );
  }

  return data as unknown as CommunityServiceListing;
}

export async function updateCommunityServiceListing(
  listingId: string,
  input:
    CommunityServiceListingInput,
  submitForReview = false,
): Promise<CommunityServiceListing> {
  const supabase = getClient();

  await requireUser(supabase);

  const update = {
    ...listingPayload(input),

    ...(submitForReview
      ? {
          moderation_status:
            "submitted" as const,
        }
      : {}),
  };

  const { data, error } =
    await supabase
      .from(
        "community_service_listings",
      )
      .update(update)
      .eq(
        "id",
        requiredText(
          listingId,
          "Service listing",
        ),
      )
      .select("*")
      .single();

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The service listing could not be updated.",
    );
  }

  return data as unknown as CommunityServiceListing;
}

export async function submitCommunityServiceListing(
  listingId: string,
): Promise<CommunityServiceListing> {
  const supabase = getClient();

  await requireUser(supabase);

  const { data, error } =
    await supabase
      .from(
        "community_service_listings",
      )
      .update({
        moderation_status:
          "submitted",
      })
      .eq(
        "id",
        requiredText(
          listingId,
          "Service listing",
        ),
      )
      .select("*")
      .single();

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The service listing could not be submitted for review.",
    );
  }

  return data as unknown as CommunityServiceListing;
}

export async function readSavedCommunityServiceListingIds():
  Promise<string[]> {
  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  const { data, error } =
    await supabase
      .from(
        "community_service_listing_saves",
      )
      .select("listing_id")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw friendlyDirectoryError(
      error,
      "Saved services could not be loaded.",
    );
  }

  return (
    data ?? []
  ).map(
    (record) =>
      String(record.listing_id),
  );
}

export async function saveCommunityServiceListing(
  listingId: string,
): Promise<void> {
  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  const { error } =
    await supabase
      .from(
        "community_service_listing_saves",
      )
      .upsert(
        {
          user_id: user.id,
          listing_id:
            requiredText(
              listingId,
              "Service listing",
            ),
        },
        {
          onConflict:
            "user_id,listing_id",
        },
      );

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The service could not be saved.",
    );
  }
}

export async function unsaveCommunityServiceListing(
  listingId: string,
): Promise<void> {
  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  const { error } =
    await supabase
      .from(
        "community_service_listing_saves",
      )
      .delete()
      .eq("user_id", user.id)
      .eq(
        "listing_id",
        requiredText(
          listingId,
          "Service listing",
        ),
      );

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The saved service could not be removed.",
    );
  }
}

export async function isCommunityServiceModerator():
  Promise<boolean> {
  const supabase = getClient();

  await requireUser(supabase);

  const { data, error } =
    await supabase.rpc(
      "sm_is_community_service_moderator",
    );

  if (error) {
    throw friendlyDirectoryError(
      error,
      "Community moderation access could not be checked.",
    );
  }

  return data === true;
}

export async function readCommunityServiceModerationQueue():
  Promise<CommunityServiceListing[]> {
  const supabase = getClient();

  await requireUser(supabase);

  const { data, error } =
    await supabase
      .from(
        "community_service_listings",
      )
      .select("*")
      .in(
        "moderation_status",
        [
          "submitted",
          "suspended",
        ],
      )
      .order("submitted_at", {
        ascending: true,
        nullsFirst: false,
      });

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The Services Directory moderation queue could not be loaded.",
    );
  }

  return (
    data ?? []
  ) as unknown as CommunityServiceListing[];
}

export async function readCommunityServiceListingReviews(
  listingId: string,
): Promise<CommunityServiceListingReview[]> {
  const supabase = getClient();

  await requireUser(supabase);

  const { data, error } =
    await supabase
      .from(
        "community_service_listing_reviews",
      )
      .select("*")
      .eq(
        "listing_id",
        requiredText(
          listingId,
          "Service listing",
        ),
      )
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The service listing review history could not be loaded.",
    );
  }

  return (
    data ?? []
  ) as unknown as CommunityServiceListingReview[];
}

export async function reviewCommunityServiceListing(
  input:
    ReviewCommunityServiceListingInput,
): Promise<CommunityServiceListing> {
  const supabase = getClient();

  await requireUser(supabase);

  const { data, error } =
    await supabase.rpc(
      "sm_review_community_service_listing",
      {
        p_listing_id:
          requiredText(
            input.listingId,
            "Service listing",
          ),

        p_decision:
          input.decision,

        p_reason:
          input.reason?.trim() ??
          "",

        p_verification_status:
          input.verificationStatus ??
          null,

        p_review_due_at:
          optionalDate(
            input.reviewDueAt,
          ),
      },
    );

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The service listing review could not be saved.",
    );
  }

  return data as unknown as CommunityServiceListing;
}


export async function createCommunityServiceEnquiry(
  input:
    CommunityServiceEnquiryInput,
): Promise<CommunityServiceEnquiry> {
  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  const preferredContactMethod =
    input.preferredContactMethod ??
    "platform";

  const consentToShareContact =
    input.consentToShareContact ===
    true;

  if (
    preferredContactMethod !==
      "platform" &&
    !consentToShareContact
  ) {
    throw new Error(
      "Consent is required before contact details can be shared.",
    );
  }

  const { data, error } =
    await supabase
      .from(
        "community_service_enquiries",
      )
      .insert({
        listing_id:
          requiredText(
            input.listingId,
            "Service listing",
          ),

        sender_user_id:
          user.id,

        subject:
          requiredText(
            input.subject,
            "Enquiry subject",
          ),

        message:
          requiredText(
            input.message,
            "Enquiry message",
          ),

        contact_name:
          input.contactName?.trim() ??
          "",

        contact_email:
          input.contactEmail?.trim() ??
          "",

        contact_phone:
          input.contactPhone?.trim() ??
          "",

        preferred_contact_method:
          preferredContactMethod,

        consent_to_share_contact:
          consentToShareContact,
      })
      .select("*")
      .single();

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The service enquiry could not be sent.",
    );
  }

  return data as unknown as CommunityServiceEnquiry;
}

export async function readMyCommunityServiceEnquiries():
  Promise<CommunityServiceEnquiry[]> {
  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  const { data, error } =
    await supabase
      .from(
        "community_service_enquiries",
      )
      .select(
        "*, community_service_listings(id, service_name, organisation_name, owner_user_id)",
      )
      .eq(
        "sender_user_id",
        user.id,
      )
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw friendlyDirectoryError(
      error,
      "Your service enquiries could not be loaded.",
    );
  }

  return (
    data ?? []
  ) as unknown as CommunityServiceEnquiry[];
}

export async function readReceivedCommunityServiceEnquiries():
  Promise<CommunityServiceEnquiry[]> {
  const supabase = getClient();

  await requireUser(supabase);

  const { data, error } =
    await supabase
      .from(
        "community_service_enquiries",
      )
      .select(
        "*, community_service_listings!inner(id, service_name, organisation_name, owner_user_id)",
      )
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw friendlyDirectoryError(
      error,
      "Received service enquiries could not be loaded.",
    );
  }

  return (
    data ?? []
  ) as unknown as CommunityServiceEnquiry[];
}

export async function respondToCommunityServiceEnquiry(
  input:
    CommunityServiceEnquiryResponseInput,
): Promise<CommunityServiceEnquiry> {
  const supabase = getClient();

  await requireUser(supabase);

  const { data, error } =
    await supabase.rpc(
      "sm_respond_to_community_service_enquiry",
      {
        p_enquiry_id:
          requiredText(
            input.enquiryId,
            "Service enquiry",
          ),

        p_response:
          requiredText(
            input.response,
            "Provider response",
          ),

        p_close:
          input.close === true,
      },
    );

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The provider response could not be sent.",
    );
  }

  return data as unknown as CommunityServiceEnquiry;
}

export async function withdrawCommunityServiceEnquiry(
  enquiryId: string,
): Promise<CommunityServiceEnquiry> {
  const supabase = getClient();

  await requireUser(supabase);

  const { data, error } =
    await supabase.rpc(
      "sm_withdraw_community_service_enquiry",
      {
        p_enquiry_id:
          requiredText(
            enquiryId,
            "Service enquiry",
          ),
      },
    );

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The service enquiry could not be withdrawn.",
    );
  }

  return data as unknown as CommunityServiceEnquiry;
}

export async function readCommunityServiceCircleSaves(
  circleId: string,
): Promise<CommunityServiceCircleSave[]> {
  const supabase = getClient();

  await requireUser(supabase);

  const { data, error } =
    await supabase
      .from(
        "community_service_circle_saves",
      )
      .select(
        "*, community_service_listings(*)",
      )
      .eq(
        "circle_id",
        requiredText(
          circleId,
          "Circle",
        ),
      )
      .is("archived_at", null)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw friendlyDirectoryError(
      error,
      "Circle services could not be loaded.",
    );
  }

  return (
    data ?? []
  ) as unknown as CommunityServiceCircleSave[];
}

export async function saveCommunityServiceToCircle(
  input:
    CommunityServiceCircleSaveInput,
): Promise<CommunityServiceCircleSave> {
  const supabase = getClient();

  await requireUser(supabase);

  const { data, error } =
    await supabase.rpc(
      "sm_save_community_service_to_circle",
      {
        p_listing_id:
          requiredText(
            input.listingId,
            "Service listing",
          ),

        p_circle_id:
          requiredText(
            input.circleId,
            "Circle",
          ),

        p_participant_id:
          requiredText(
            input.participantId,
            "Participant",
          ),

        p_note:
          input.note?.trim() ??
          "",
      },
    );

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The service could not be saved to the Circle.",
    );
  }

  return data as unknown as CommunityServiceCircleSave;
}

export async function removeCommunityServiceFromCircle(
  saveId: string,
): Promise<CommunityServiceCircleSave> {
  const supabase = getClient();

  await requireUser(supabase);

  const { data, error } =
    await supabase.rpc(
      "sm_remove_community_service_from_circle",
      {
        p_save_id:
          requiredText(
            saveId,
            "Saved Circle service",
          ),
      },
    );

  if (error) {
    throw friendlyDirectoryError(
      error,
      "The service could not be removed from the Circle.",
    );
  }

  return data as unknown as CommunityServiceCircleSave;
}