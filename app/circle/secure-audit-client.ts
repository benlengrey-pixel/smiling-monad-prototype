"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type SecureAuditAction =
  | "insert"
  | "update"
  | "archive"
  | "status_change"
  | "permission_change"
  | "membership_change"
  | "consent_change";

export type SecureAuditEvent = {
  id: string;
  circle_id: string | null;
  participant_id: string | null;
  actor_user_id: string | null;
  action: SecureAuditAction;
  entity_type: string;
  entity_id: string;
  changed_fields: string[];
  event_summary: string;
  request_id: string;
  source: string;
  created_at: string;
};

function describeAuditError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "The secure audit history could not be loaded.";
}

async function requireSignedInUser(): Promise<void> {
  const supabase =
    getSupabaseBrowserClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error(
      "You must be signed in.",
    );
  }
}

export async function readSecureCircleAuditHistory(
  circleId: string,
  limit = 100,
): Promise<SecureAuditEvent[]> {
  const cleanCircleId =
    circleId.trim();

  if (!cleanCircleId) {
    throw new Error(
      "A Circle must be selected.",
    );
  }

  await requireSignedInUser();

  const supabase =
    getSupabaseBrowserClient();

  const safeLimit = Math.min(
    Math.max(
      Number.isFinite(limit)
        ? Math.trunc(limit)
        : 100,
      1,
    ),
    250,
  );

  const { data, error } =
    await supabase
      .from("audit_events")
      .select(
        `
          id,
          circle_id,
          participant_id,
          actor_user_id,
          action,
          entity_type,
          entity_id,
          changed_fields,
          event_summary,
          request_id,
          source,
          created_at
        `,
      )
      .eq("circle_id", cleanCircleId)
      .order("created_at", {
        ascending: false,
      })
      .limit(safeLimit);

  if (error) {
    throw new Error(
      describeAuditError(error),
    );
  }

  return (
    data ?? []
  ) as SecureAuditEvent[];
}