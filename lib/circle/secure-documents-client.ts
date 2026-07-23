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

const DOCUMENT_BUCKET =
  "sm-circle-files" as const;

const MAX_FILE_SIZE_BYTES =
  15 * 1024 * 1024;

const ALLOWED_MIME_TYPES =
  new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

function getClient(): SupabaseClient {
  return getSupabaseBrowserClient();
}

function openSignIn(
  returnTo: string,
): void {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  window.location.assign(
    `/sign-in?returnTo=${encodeURIComponent(
      returnTo,
    )}`,
  );
}

async function requireUser(
  supabase: SupabaseClient,
  returnTo: string,
  redirectToSignIn: boolean,
): Promise<User> {
  const {
    data: { user },
    error,
  } =
    await supabase.auth.getUser();

  if (error || !user) {
    if (redirectToSignIn) {
      openSignIn(returnTo);
    }

    throw new Error(
      "Please sign in to continue.",
    );
  }

  return user;
}

function friendlyDocumentError(
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
    const candidate =
      error as {
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
        "You do not have permission to access this document.",
      );
    }

    if (
      combined.includes(
        "maximum allowed size",
      ) ||
      combined.includes(
        "payload too large",
      )
    ) {
      return new Error(
        "This file is too large to upload.",
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

function requiredId(
  value: string,
  label: string,
): string {
  const clean =
    requiredText(value, label);

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      clean,
    )
  ) {
    throw new Error(
      `${label} is not valid.`,
    );
  }

  return clean;
}

function safeFilename(
  filename: string,
): string {
  const clean = filename
    .trim()
    .replace(
      /[^a-zA-Z0-9._-]+/g,
      "-",
    )
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return clean || "document";
}

function validateFile(
  file: File,
): void {
  if (
    !file ||
    file.size <= 0
  ) {
    throw new Error(
      "Choose a document to upload.",
    );
  }

  if (
    file.size >
    MAX_FILE_SIZE_BYTES
  ) {
    throw new Error(
      "Documents must be 15 MB or smaller.",
    );
  }

  const mimeType =
    file.type.trim().toLowerCase();

  if (
    !mimeType ||
    !ALLOWED_MIME_TYPES.has(
      mimeType,
    )
  ) {
    throw new Error(
      "This file type is not allowed. Use PDF, Word, Excel, text, CSV, JPEG, PNG or WebP.",
    );
  }
}

export async function readSecureCircleDocuments(
  circleId: string,
): Promise<SecureCircleDocument[]> {
  const supabase = getClient();

  await requireUser(
    supabase,
    "/circle?panel=documents",
    true,
  );

  const cleanCircleId =
    requiredId(circleId, "Circle");

  const { data, error } =
    await supabase
      .from("documents")
      .select("*")
      .eq(
        "circle_id",
        cleanCircleId,
      )
      .neq(
        "document_status",
        "archived",
      )
      .order("updated_at", {
        ascending: false,
      });

  if (error) {
    throw friendlyDocumentError(
      error,
      "The Circle documents could not be loaded.",
    );
  }

  return (
    data ?? []
  ) as unknown as SecureCircleDocument[];
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

  const user = await requireUser(
    supabase,
    "/circle?panel=documents",
    false,
  );

  const cleanCircleId =
    requiredId(circleId, "Circle");

  const cleanParticipantId =
    requiredId(
      participantId,
      "Participant",
    );

  const cleanTitle =
    requiredText(
      title,
      "Document title",
    );

  validateFile(file);

  const documentId =
    globalThis.crypto.randomUUID();

  const filename =
    safeFilename(file.name);

  const storagePath = [
    cleanCircleId,
    cleanParticipantId,
    documentId,
    filename,
  ].join("/");

  const mimeType =
    file.type
      .trim()
      .toLowerCase();

  const {
    error: uploadError,
  } =
    await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(
        storagePath,
        file,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: mimeType,
        },
      );

  if (uploadError) {
    throw friendlyDocumentError(
      uploadError,
      "The document could not be uploaded.",
    );
  }

  const consentRequired =
    sensitivity === "health" ||
    sensitivity === "financial" ||
    sensitivity === "restricted";

  const {
    data,
    error: metadataError,
  } =
    await supabase
      .from("documents")
      .insert({
        id: documentId,
        circle_id:
          cleanCircleId,
        participant_id:
          cleanParticipantId,
        title: cleanTitle,
        description:
          description.trim(),
        category,
        sensitivity,
        document_status:
          "draft",
        storage_bucket:
          DOCUMENT_BUCKET,
        storage_path:
          storagePath,
        original_filename:
          file.name,
        mime_type:
          mimeType,
        size_bytes:
          file.size,
        consent_required:
          consentRequired,
        consent_id: null,
        created_by:
          user.id,
        updated_by:
          user.id,
      })
      .select("*")
      .single();

  if (metadataError) {
    await supabase.storage
      .from(DOCUMENT_BUCKET)
      .remove([storagePath]);

    throw friendlyDocumentError(
      metadataError,
      "The document record could not be created.",
    );
  }

  return data as unknown as SecureCircleDocument;
}

export async function createSecureDocumentDownloadUrl(
  document: SecureCircleDocument,
): Promise<string> {
  const supabase = getClient();

  await requireUser(
    supabase,
    "/circle?panel=documents",
    false,
  );

  requiredId(
    document.circle_id,
    "Circle",
  );

  requiredId(
    document.participant_id,
    "Participant",
  );

  if (
    document.storage_bucket !==
    DOCUMENT_BUCKET
  ) {
    throw new Error(
      "The document storage location is not valid.",
    );
  }

  const expectedPrefix =
    `${document.circle_id}/${document.participant_id}/`;

  if (
    !document.storage_path.startsWith(
      expectedPrefix,
    )
  ) {
    throw new Error(
      "The document storage path is not valid.",
    );
  }

  const { data, error } =
    await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(
        document.storage_path,
        60,
      );

  if (
    error ||
    !data?.signedUrl
  ) {
    throw friendlyDocumentError(
      error,
      "The document could not be opened.",
    );
  }

  return data.signedUrl;
}

export async function archiveSecureCircleDocument(
  documentId: string,
): Promise<void> {
  const supabase = getClient();

  const user = await requireUser(
    supabase,
    "/circle?panel=documents",
    false,
  );

  const cleanDocumentId =
    requiredId(
      documentId,
      "Document",
    );

  const { error } =
    await supabase
      .from("documents")
      .update({
        document_status:
          "archived",
        archived_at:
          new Date().toISOString(),
        updated_by:
          user.id,
      })
      .eq(
        "id",
        cleanDocumentId,
      );

  if (error) {
    throw friendlyDocumentError(
      error,
      "The document could not be archived.",
    );
  }
}