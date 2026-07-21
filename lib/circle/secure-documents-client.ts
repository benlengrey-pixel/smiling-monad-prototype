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

type UploadSecureCircleDocumentInput = {
  circleId: string;
  participantId: string;
  title: string;
  description?: string;
  category: SecureDocumentCategory;
  sensitivity: SecureDocumentSensitivity;
  file: File;
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
  redirectToMfa: boolean,
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
    if (redirectToMfa) {
      openMfa(returnTo);
    }

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
    lowerMessage.includes("aal2") ||
    lowerMessage.includes(
      "two-step security",
    )
  ) {
    return new Error(
      "Two-step security is required.",
    );
  }

  if (
    lowerMessage.includes(
      "row-level security",
    ) ||
    lowerMessage.includes(
      "permission denied",
    )
  ) {
    return new Error(
      "You do not have permission to access this document.",
    );
  }

  if (
    lowerMessage.includes(
      "maximum allowed size",
    ) ||
    lowerMessage.includes(
      "payload too large",
    )
  ) {
    return new Error(
      "This file is too large to upload.",
    );
  }

  return new Error(message);
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

function safeFilename(
  filename: string,
): string {
  const cleaned = filename
    .trim()
    .replace(
      /[^a-zA-Z0-9._-]+/g,
      "-",
    )
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "document";
}

export async function readSecureCircleDocuments(
  circleId: string,
): Promise<SecureCircleDocument[]> {
  const supabase = getClient();

  await requireAal2(
    supabase,
    "/circle?panel=documents",
    true,
  );

  const {
    data,
    error,
  } = await supabase
    .from("documents")
    .select("*")
    .eq("circle_id", circleId)
    .neq(
      "document_status",
      "archived",
    )
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

export async function uploadSecureCircleDocument({
  circleId,
  participantId,
  title,
  description = "",
  category,
  sensitivity,
  file,
}: UploadSecureCircleDocumentInput): Promise<SecureCircleDocument> {
  const supabase = getClient();

  const user = await requireAal2(
    supabase,
    "/circle?panel=documents",
    false,
  );

  const cleanTitle = requiredText(
    title,
    "Document title",
  );

  if (!file || file.size <= 0) {
    throw new Error(
      "Choose a document to upload.",
    );
  }

  const documentId =
    globalThis.crypto.randomUUID();

  const filename = safeFilename(
    file.name,
  );

  const storagePath = [
    circleId,
    participantId,
    documentId,
    filename,
  ].join("/");

  const {
    error: uploadError,
  } = await supabase.storage
    .from("sm-circle-files")
    .upload(
      storagePath,
      file,
      {
        cacheControl: "3600",
        upsert: false,
        contentType:
          file.type ||
          "application/octet-stream",
      },
    );

  if (uploadError) {
    throw friendlyDocumentError(
      uploadError.message,
    );
  }

  const consentRequired =
    sensitivity === "health" ||
    sensitivity === "financial" ||
    sensitivity === "restricted";

  const {
    data,
    error: metadataError,
  } = await supabase
    .from("documents")
    .insert({
      id: documentId,
      circle_id: circleId,
      participant_id:
        participantId,
      title: cleanTitle,
      description:
        description.trim(),
      category,
      sensitivity,
      document_status: "draft",
      storage_bucket:
        "sm-circle-files",
      storage_path: storagePath,
      original_filename:
        file.name,
      mime_type:
        file.type ||
        "application/octet-stream",
      size_bytes: file.size,
      consent_required:
        consentRequired,
      consent_id: null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("*")
    .single();

  if (metadataError) {
    await supabase.storage
      .from("sm-circle-files")
      .remove([storagePath]);

    throw friendlyDocumentError(
      metadataError.message,
    );
  }

  return data as SecureCircleDocument;
}

export async function createSecureDocumentDownloadUrl(
  document: SecureCircleDocument,
): Promise<string> {
  const supabase = getClient();

  await requireAal2(
    supabase,
    "/circle?panel=documents",
    false,
  );

  const {
    data,
    error,
  } = await supabase.storage
    .from(
      document.storage_bucket,
    )
    .createSignedUrl(
      document.storage_path,
      60,
    );

  if (error || !data?.signedUrl) {
    throw friendlyDocumentError(
      error?.message ||
        "The document could not be opened.",
    );
  }

  return data.signedUrl;
}

export async function archiveSecureCircleDocument(
  documentId: string,
): Promise<void> {
  const supabase = getClient();

  const user = await requireAal2(
    supabase,
    "/circle?panel=documents",
    false,
  );

  const {
    error,
  } = await supabase
    .from("documents")
    .update({
      document_status:
        "archived",
      updated_by: user.id,
    })
    .eq("id", documentId);

  if (error) {
    throw friendlyDocumentError(
      error.message,
    );
  }
}