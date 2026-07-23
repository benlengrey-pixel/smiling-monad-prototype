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
 *
 * The relative import is intentional. It allows the application
 * alias to point at this adapter without creating an import loop.
 */

export * from "./secure-community-services-client";

export {
  readSafeApprovedCommunityServiceListings
    as readApprovedCommunityServiceListings,
} from "./public-community-services-client";