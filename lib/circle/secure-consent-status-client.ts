"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type SecureConsentStatus = {
  id: string;
  consent_status: string;
  consented_at: string | null;
  review_due_at: string | null;
  valid_until: string | null;
  restrictions: string;
  given_by_name: string;
  authority_basis: string;
};

export type ConsentHealth =
  | "current"
  | "review_due"
  | "expired"
  | "withdrawn"
  | "missing";

export type SecureConsentSummary = {
  consent: SecureConsentStatus | null;
  health: ConsentHealth;
  message: string;
};

export async function readSecureConsentSummary(
  participantId: string,
  circleId: string,
): Promise<SecureConsentSummary> {
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
        consent_status,
        consented_at,
        review_due_at,
        valid_until,
        restrictions,
        given_by_name,
        authority_basis
      `,
    )
    .eq("participant_id", participantId)
    .eq("circle_id", circleId)
    .eq("consent_type", "information_collection")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const consent = data as SecureConsentStatus | null;

  if (!consent) {
    return {
      consent: null,
      health: "missing",
      message: "Privacy consent has not been recorded.",
    };
  }

  if (consent.consent_status === "withdrawn") {
    return {
      consent,
      health: "withdrawn",
      message: "Privacy consent has been withdrawn.",
    };
  }

  const now = Date.now();

  if (
    consent.valid_until &&
    new Date(consent.valid_until).getTime() <= now
  ) {
    return {
      consent,
      health: "expired",
      message: "Privacy consent has expired.",
    };
  }

  if (
    consent.review_due_at &&
    new Date(consent.review_due_at).getTime() <= now
  ) {
    return {
      consent,
      health: "review_due",
      message: "Privacy consent is due for review.",
    };
  }

  return {
    consent,
    health: "current",
    message: "Privacy consent is current.",
  };
}