"use client";

import type {
  SupabaseClient,
  User,
} from "@supabase/supabase-js";

import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

export type SecureDocumentCategory =
  | "plan"
  | "agreement"
  | "report"
  | "meeting"
  | "assessment"
  | "health"
  | "financial"
  | "consent"
  | "correspondence"
  | "other";

export type SecureDocumentSensitivity =
  | "general"
  | "personal"
  | "health"
  | "financial"
  | "restricted";

export type SecureDocumentStatus =
  | "draft"
  | "current"
  | "review_needed"
  | "archived";

export type SecureCircleDocument = {
  id: string;
  circle_id: string;
  participant_id: string;
  title: string;
  description: string;
  category: SecureDocumentCategory;
  sensitivity: SecureDocumentSensitivity;
  document_status: SecureDocumentStatus;
  storage_bucket: "sm-circle-files";
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  consent_required: boolean;
  consent_id: string | null;
  review_due_at: string | null;
  archived_at: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

function getClient(): SupabaseClient {
  return getSupabaseBrowserClient();
}

function openSignIn(
  returnTo: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(
    `/sign-in?returnTo=${encodeURIComponent(
      returnTo,
    )}`,
  );
}

function openMfa(
  returnTo: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(
    `/security/mfa?returnTo=${encodeURIComponent(
      returnTo,
    )}`,
  );
}

async function requireUser(
  supabase: SupabaseClient,
  returnTo: string,
): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    openSignIn(returnTo);

    throw new Error(
      "Please sign in to continue.",
    );
  }

  return user;
}

async function requireAal2(
  supabase: SupabaseClient,
  returnTo: string,
): Promise<User> {
  const user = await requireUser(
    supabase,
    returnTo,
  );

  const {
    data: assurance,
    error,
  } =
    await supabase.auth.mfa
      .getAuthenticatorAssuranceLevel();

  if (
    error ||
    assurance.currentLevel !== "aal2"
  ) {
    openMfa(returnTo);

    throw new Error(
      "Two-step security is required.",
    );
  }

  return user;
}

function friendlyDocumentError(
  message: string,
): Error {
  const lowerMessage =
    message.toLowerCase();

  if (
    lowerMessage.includes(
      "sm_require_aal2",
    ) ||
    lowerMessage.includes("aal2")
  ) {
    return new Error(
      "Two-step security is required.",
    );
  }

  if (
    lowerMessage.includes(
      "row-level security",
    )
  ) {
    return new Error(
      "You do not have permission to access this document.",
    );
  }

  return new Error(message);
}

export async function readSecureCircleDocuments(
  circleId: string,
): Promise<SecureCircleDocument[]> {
  const supabase = getClient();

  await requireAal2(
    supabase,
    "/circle?panel=documents",
  );

  const {
    data,
    error,
  } = await supabase
    .from("documents")
    .select("*")
    .eq("circle_id", circleId)
    .neq("document_status", "archived")
    .order("updated_at", {
      ascending: false,
    });

  if (error) {
    throw friendlyDocumentError(
      error.message,
    );
  }

  return (
    data as SecureCircleDocument[] | null
  ) ?? [];
}

export async function archiveSecureCircleDocument(
  documentId: string,
): Promise<void> {
  const supabase = getClient();

  const user = await requireAal2(
    supabase,
    "/circle?panel=documents",
  );

  const {
    error,
  } = await supabase
    .from("documents")
    .update({
      document_status: "archived",
      updated_by: user.id,
    })
    .eq("id", documentId);

  if (error) {
    throw friendlyDocumentError(
      error.message,
    );
  }
}