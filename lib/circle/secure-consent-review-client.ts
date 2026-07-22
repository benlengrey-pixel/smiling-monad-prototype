"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type ConsentReviewState =
  | "review_due"
  | "expiring_soon"
  | "expired";

export type SecureConsentReviewItem = {
  id: string;
  participant_id: string;
  circle_id: string;
  given_by_name: string;
  authority_basis: string;
  consent_status: string;
  review_due_at: string | null;
  valid_until: string | null;
  created_at: string;
  review_state: ConsentReviewState;
};

type ConsentRow = Omit<
  SecureConsentReviewItem,
  "review_state"
>;

const EXPIRING_SOON_DAYS = 30;

function resolveReviewState(
  reviewDueAt: string | null,
  validUntil: string | null,
): ConsentReviewState | null {
  const now = Date.now();

  if (
    validUntil &&
    new Date(validUntil).getTime() <= now
  ) {
    return "expired";
  }

  if (
    reviewDueAt &&
    new Date(reviewDueAt).getTime() <= now
  ) {
    return "review_due";
  }

  if (validUntil) {
    const warningTime =
      now +
      EXPIRING_SOON_DAYS *
        24 *
        60 *
        60 *
        1000;

    if (
      new Date(validUntil).getTime() <=
      warningTime
    ) {
      return "expiring_soon";
    }
  }

  return null;
}

export async function readSecureConsentReviews(
  circleId: string,
): Promise<SecureConsentReviewItem[]> {
  const supabase = getSupabaseBrowserClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in.");
  }

  const { data, error } = await supabase
    .from("participant_consents")
    .select(
      `
        id,
        participant_id,
        circle_id,
        given_by_name,
        authority_basis,
        consent_status,
        review_due_at,
        valid_until,
        created_at
      `,
    )
    .eq("circle_id", circleId)
    .eq(
      "consent_type",
      "information_collection",
    )
    .eq("consent_status", "active")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const latestByParticipant =
    new Map<string, ConsentRow>();

  for (const row of (data ?? []) as ConsentRow[]) {
    if (
      !latestByParticipant.has(
        row.participant_id,
      )
    ) {
      latestByParticipant.set(
        row.participant_id,
        row,
      );
    }
  }

  return Array.from(
    latestByParticipant.values(),
  )
    .map((row) => {
      const reviewState =
        resolveReviewState(
          row.review_due_at,
          row.valid_until,
        );

      return reviewState
        ? {
            ...row,
            review_state: reviewState,
          }
        : null;
    })
    .filter(
      (
        item,
      ): item is SecureConsentReviewItem =>
        item !== null,
    )
    .sort((left, right) => {
      const leftDate =
        left.valid_until ??
        left.review_due_at ??
        left.created_at;

      const rightDate =
        right.valid_until ??
        right.review_due_at ??
        right.created_at;

      return (
        new Date(leftDate).getTime() -
        new Date(rightDate).getTime()
      );
    });
}