"use client";

/*
 * Application-facing Services Directory adapter.
 *
 * Private provider, moderator, enquiry and Circle operations
 * continue to come from the secure client.
 *
 * Public approved-listing browsing is overridden by the
 * public-safe database view client so public visitors never
 * download owner account IDs, ABNs or internal moderation data.
 */

export * from "@/lib/community/secure-community-services-client";

export {
  readSafeApprovedCommunityServiceListings
    as readApprovedCommunityServiceListings,
} from "@/lib/community/public-community-services-client";