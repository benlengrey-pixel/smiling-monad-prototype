"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type ConsentAuthorityBasis =
  | "self"
  | "supported_decision"
  | "nominee"
  | "guardian"
  | "parent"
  | "other";

export type ConsentInformationCategory =
  | "identity"
  | "contact"
  | "goals"
  | "communication"
  | "daily_life"
  | "support_notes"
  | "health"
  | "medication"
  | "behaviour"
  | "financial"
  | "documents"
  | "photos"
  | "other";

export type ConsentPermittedRole =
  | "participant"
  | "nominee"
  | "family"
  | "support_worker"
  | "support_coordinator"
  | "professional"
  | "circle_manager"
  | "circle_member";

export type ParticipantConsentInput = {
  participantId: string;
  circleId: string;
  givenByUserId: string | null;
  givenByName: string;
  authorityBasis: ConsentAuthorityBasis;
  purpose: string;
  informationScope: string;
  recipientScope: string;
  informationCategories: ConsentInformationCategory[];
  permittedRoles: ConsentPermittedRole[];
  restrictions: string;
  evidenceNotes: string;
  consentedAt: string;
  validFrom: string | null;
  validUntil: string | null;
  reviewDueAt: string | null;
};

export type ParticipantConsentGateStatus = {
  allowed: boolean;
  consent_id: string | null;
  consent_status: string | null;
  consented_at: string | null;
  review_due_at: string | null;
  valid_until: string | null;
  restrictions: string | null;
};

async function requireSecureSession(): Promise<string> {
  const supabase =
    getSupabaseBrowserClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "You must be signed in.",
    );
  }

  const {
    data: assurance,
    error: assuranceError,
  } =
    await supabase.auth.mfa
      .getAuthenticatorAssuranceLevel();

  if (assuranceError) {
    throw new Error(
      assuranceError.message,
    );
  }

  if (
    assurance.currentLevel !== "aal2"
  ) {
    throw new Error(
      "Two-step security is required.",
    );
  }

  return user.id;
}

export async function readParticipantConsentGateStatus(
  participantId: string,
  circleId: string,
): Promise<ParticipantConsentGateStatus | null> {
  await requireSecureSession();

  const supabase =
    getSupabaseBrowserClient();

  const { data, error } =
    await supabase.rpc(
      "sm_participant_profile_consent_status",
      {
        requested_participant_id:
          participantId,
        requested_circle_id:
          circleId,
      },
    );

  if (error) {
    throw new Error(error.message);
  }

  const firstRecord =
    Array.isArray(data)
      ? data[0]
      : data;

  return (
    firstRecord ??
    null
  ) as ParticipantConsentGateStatus | null;
}

export async function createParticipantPrivacyConsent(
  input: ParticipantConsentInput,
): Promise<string> {
  const recordedBy =
    await requireSecureSession();

  const supabase =
    getSupabaseBrowserClient();

  const { data, error } =
    await supabase
      .from("participant_consents")
      .insert({
        participant_id:
          input.participantId,
        circle_id:
          input.circleId,
        consent_type:
          "information_collection",
        consent_status:
          "active",
        given_by_user_id:
          input.givenByUserId,
        given_by_name:
          input.givenByName.trim(),
        authority_basis:
          input.authorityBasis,
        purpose:
          input.purpose.trim(),
        information_scope:
          input.informationScope.trim(),
        recipient_scope:
          input.recipientScope.trim(),
        information_categories:
          input.informationCategories,
        permitted_roles:
          input.permittedRoles,
        restrictions:
          input.restrictions.trim(),
        evidence_notes:
          input.evidenceNotes.trim(),
        consented_at:
          input.consentedAt,
        valid_from:
          input.validFrom,
        valid_until:
          input.validUntil,
        review_due_at:
          input.reviewDueAt,
        recorded_by:
          recordedBy,
      })
      .select("id")
      .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
}

export async function withdrawParticipantPrivacyConsent(
  consentId: string,
  reason: string,
): Promise<void> {
  await requireSecureSession();

  const cleanReason =
    reason.trim();

  if (!cleanReason) {
    throw new Error(
      "A withdrawal reason is required.",
    );
  }

  const supabase =
    getSupabaseBrowserClient();

  const { error } =
    await supabase
      .from("participant_consents")
      .update({
        consent_status:
          "withdrawn",
        withdrawn_at:
          new Date().toISOString(),
        withdrawal_reason:
          cleanReason,
      })
      .eq("id", consentId);

  if (error) {
    throw new Error(error.message);
  }
}