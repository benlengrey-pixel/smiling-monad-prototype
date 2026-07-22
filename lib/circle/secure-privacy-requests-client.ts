"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type PrivacyRequestType =
  | "access"
  | "correction"
  | "export"
  | "restriction"
  | "deletion";

export type PrivacyRequestStatus =
  | "submitted"
  | "acknowledged"
  | "in_progress"
  | "completed"
  | "partially_completed"
  | "declined"
  | "cancelled";

export type SecurePrivacyRequest = {
  id: string;
  participant_id: string;
  circle_id: string;
  requested_by_user_id: string;
  request_type: PrivacyRequestType;
  request_details: string;
  status: PrivacyRequestStatus;
  assigned_to_user_id: string | null;
  due_at: string;
  acknowledged_at: string | null;
  completed_at: string | null;
  outcome_summary: string;
  refusal_reason: string;
  identity_verified_at: string | null;
  identity_verified_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatePrivacyRequestInput = {
  participantId: string;
  circleId: string;
  requestType: PrivacyRequestType;
  requestDetails: string;
};

export type UpdatePrivacyRequestInput = {
  requestId: string;
  status: PrivacyRequestStatus;
  assignedToUserId?: string | null;
  outcomeSummary?: string;
  refusalReason?: string;
  identityVerified?: boolean;
};

async function requireSignedInUserId(): Promise<string> {
  const supabase = getSupabaseBrowserClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in.");
  }

  return user.id;
}

export async function readSecurePrivacyRequests(
  circleId: string,
): Promise<SecurePrivacyRequest[]> {
  await requireSignedInUserId();

  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("participant_privacy_requests")
    .select("*")
    .eq("circle_id", circleId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SecurePrivacyRequest[];
}

export async function createSecurePrivacyRequest(
  input: CreatePrivacyRequestInput,
): Promise<SecurePrivacyRequest> {
  const userId =
    await requireSignedInUserId();

  if (!input.requestDetails.trim()) {
    throw new Error(
      "Describe what information or action is being requested.",
    );
  }

  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("participant_privacy_requests")
    .insert({
      participant_id: input.participantId,
      circle_id: input.circleId,
      requested_by_user_id: userId,
      request_type: input.requestType,
      request_details:
        input.requestDetails.trim(),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SecurePrivacyRequest;
}

export async function updateSecurePrivacyRequest(
  input: UpdatePrivacyRequestInput,
): Promise<SecurePrivacyRequest> {
  const userId =
    await requireSignedInUserId();

  const terminalStatuses: PrivacyRequestStatus[] = [
    "completed",
    "partially_completed",
    "declined",
    "cancelled",
  ];

  if (
    input.status === "declined" &&
    !input.refusalReason?.trim()
  ) {
    throw new Error(
      "A refusal reason is required when declining a request.",
    );
  }

  const update: Record<string, unknown> = {
    status: input.status,
  };

  if (
    input.assignedToUserId !== undefined
  ) {
    update.assigned_to_user_id =
      input.assignedToUserId;
  }

  if (
    input.outcomeSummary !== undefined
  ) {
    update.outcome_summary =
      input.outcomeSummary.trim();
  }

  if (
    input.refusalReason !== undefined
  ) {
    update.refusal_reason =
      input.refusalReason.trim();
  }

  if (input.status === "acknowledged") {
    update.acknowledged_at =
      new Date().toISOString();
  }

  if (
    terminalStatuses.includes(input.status)
  ) {
    update.completed_at =
      new Date().toISOString();
  }

  if (input.identityVerified === true) {
    update.identity_verified_at =
      new Date().toISOString();
    update.identity_verified_by_user_id =
      userId;
  }

  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("participant_privacy_requests")
    .update(update)
    .eq("id", input.requestId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SecurePrivacyRequest;
}

export function isPrivacyRequestOverdue(
  request: SecurePrivacyRequest,
): boolean {
  return (
    ![
      "completed",
      "partially_completed",
      "declined",
      "cancelled",
    ].includes(request.status) &&
    new Date(request.due_at).getTime() <
      Date.now()
  );
}