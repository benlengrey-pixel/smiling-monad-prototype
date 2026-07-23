import type {
  SupabaseClient,
  User,
} from "@supabase/supabase-js";

import {
  type SecureCircle,
  type SecureCircleMember,
  type SecureCircleWorkspace,
  type SecureParticipant,
} from "@/lib/circle/secure-circle-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type SecureCircleDirectoryParticipant = {
  id: string;
  full_name: string;
  preferred_name: string;
  status: "active" | "inactive" | "archived";
};

export type SecureCircleDirectoryMembership = Pick<
  SecureCircleMember,
  | "id"
  | "circle_id"
  | "user_id"
  | "display_name"
  | "role"
  | "relationship"
  | "membership_status"
  | "access_starts_at"
  | "access_ends_at"
  | "accepted_at"
>;

export type SecureCircleDirectoryEntry = {
  circle: SecureCircle;
  participant: SecureCircleDirectoryParticipant;
  membership: SecureCircleDirectoryMembership;
  is_owned_circle: boolean;
};

export type SecureCircleOpenResult =
  SecureCircleWorkspace & {
    created: boolean;
    setupDeclarationId?: string | null;
  };

export type ParticipantCircleCreatorRole =
  Exclude<
    SecureCircleMember["role"],
    "participant"
  >;

export type ParticipantCircleAuthorityType =
  | "participant_request"
  | "nominee_authority"
  | "family_agreement"
  | "support_setup_request"
  | "other";

export type CreateParticipantSecureCircleInput = {
  fullName: string;
  preferredName?: string;
  circleName?: string;
  creatorRole: ParticipantCircleCreatorRole;
  relationship: string;
  authorityType: ParticipantCircleAuthorityType;
  authorityBasis: string;
  authorityConfirmed: boolean;
};

type UnknownRecord = Record<
  string,
  unknown
>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CREATOR_ROLES =
  new Set<ParticipantCircleCreatorRole>([
    "nominee",
    "family",
    "support_worker",
    "support_coordinator",
    "professional",
    "circle_manager",
    "circle_member",
  ]);

const AUTHORITY_TYPES =
  new Set<ParticipantCircleAuthorityType>([
    "participant_request",
    "nominee_authority",
    "family_agreement",
    "support_setup_request",
    "other",
  ]);

function getClient(): SupabaseClient {
  return getSupabaseBrowserClient();
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function requireRecord(
  value: unknown,
  label: string,
): UnknownRecord {
  if (!isRecord(value)) {
    throw new Error(
      `${label} response was invalid.`,
    );
  }

  return value;
}

function requiredText(
  value: string,
  label: string,
  minimum: number,
  maximum: number,
): string {
  const clean = value.trim();

  if (
    clean.length < minimum ||
    clean.length > maximum
  ) {
    throw new Error(
      `${label} must contain between ${minimum} and ${maximum} characters.`,
    );
  }

  return clean;
}

function optionalText(
  value: string | undefined,
  label: string,
  maximum: number,
): string {
  const clean = value?.trim() ?? "";

  if (clean.length > maximum) {
    throw new Error(
      `${label} must contain ${maximum} characters or fewer.`,
    );
  }

  return clean;
}

function requiredUuid(
  value: string,
  label: string,
): string {
  const clean = value.trim();

  if (!UUID_PATTERN.test(clean)) {
    throw new Error(
      `${label} is not valid.`,
    );
  }

  return clean;
}

function describeDatabaseError(
  error: unknown,
  fallback: string,
): Error {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const candidate = error as {
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
        "You do not have permission to access this Circle.",
      );
    }

    if (
      combined.includes(
        "already exists",
      ) ||
      combined.includes(
        "duplicate key",
      ) ||
      candidate.code === "23505"
    ) {
      return new Error(
        "A Circle with this name already exists. Open it from My Circles instead.",
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
        : null,
    ].filter(
      (value): value is string =>
        typeof value === "string" &&
        value.trim().length > 0,
    );

    if (parts.length > 0) {
      return new Error(
        parts.join(" "),
      );
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallback);
}

async function requireUser(
  supabase: SupabaseClient,
): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw describeDatabaseError(
      error,
      "Your account could not be checked.",
    );
  }

  if (!user) {
    throw new Error(
      "You must be signed in to open your Circles.",
    );
  }

  return user;
}

function readDirectoryEntry(
  value: unknown,
): SecureCircleDirectoryEntry {
  const entry = requireRecord(
    value,
    "Circle directory",
  );

  const circle = requireRecord(
    entry.circle,
    "Circle",
  );

  const participant = requireRecord(
    entry.participant,
    "Participant",
  );

  const membership = requireRecord(
    entry.membership,
    "Membership",
  );

  return {
    circle:
      circle as unknown as SecureCircle,

    participant:
      participant as unknown as SecureCircleDirectoryParticipant,

    membership:
      membership as unknown as SecureCircleDirectoryMembership,

    is_owned_circle:
      entry.is_owned_circle === true,
  };
}

function readDirectoryResponse(
  value: unknown,
): SecureCircleDirectoryEntry[] {
  const response = requireRecord(
    value,
    "Circle directory",
  );

  const circles = response.circles;

  if (!Array.isArray(circles)) {
    throw new Error(
      "The Circle directory response was incomplete.",
    );
  }

  return circles.map(
    readDirectoryEntry,
  );
}

function readWorkspaceResponse(
  value: unknown,
  user: User,
): SecureCircleOpenResult {
  const response = requireRecord(
    value,
    "Circle workspace",
  );

  const participant = requireRecord(
    response.participant,
    "Participant",
  );

  const circle = requireRecord(
    response.circle,
    "Circle",
  );

  const membership = requireRecord(
    response.membership,
    "Membership",
  );

  const setupDeclarationId =
    typeof response.setup_declaration_id ===
    "string"
      ? response.setup_declaration_id
      : null;

  return {
    user,

    participant:
      participant as unknown as SecureParticipant,

    circle:
      circle as unknown as SecureCircle,

    membership:
      membership as unknown as SecureCircleMember,

    privateAccess: true,

    created:
      response.created === true,

    setupDeclarationId,
  };
}

export async function listMySecureCircles(): Promise<
  SecureCircleDirectoryEntry[]
> {
  const supabase = getClient();

  await requireUser(supabase);

  const { data, error } =
    await supabase.rpc(
      "sm_list_my_circles",
    );

  if (error) {
    throw describeDatabaseError(
      error,
      "Your Circles could not be loaded.",
    );
  }

  return readDirectoryResponse(data);
}

export async function createMySecureCircle(): Promise<
  SecureCircleOpenResult
> {
  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  const { data, error } =
    await supabase.rpc(
      "sm_create_my_circle",
    );

  if (error) {
    throw describeDatabaseError(
      error,
      "Your Circle could not be created.",
    );
  }

  return readWorkspaceResponse(
    data,
    user,
  );
}

export async function createParticipantSecureCircle(
  input: CreateParticipantSecureCircleInput,
): Promise<SecureCircleOpenResult> {
  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  if (
    !CREATOR_ROLES.has(
      input.creatorRole,
    )
  ) {
    throw new Error(
      "Choose your correct role in this Circle.",
    );
  }

  if (
    !AUTHORITY_TYPES.has(
      input.authorityType,
    )
  ) {
    throw new Error(
      "Choose how this Circle was requested or authorised.",
    );
  }

  if (!input.authorityConfirmed) {
    throw new Error(
      "Confirm the participant request, consent or authority basis before creating this Circle.",
    );
  }

  const { data, error } =
    await supabase.rpc(
      "sm_create_participant_circle",
      {
        p_full_name:
          requiredText(
            input.fullName,
            "Participant name",
            2,
            160,
          ),

        p_preferred_name:
          optionalText(
            input.preferredName,
            "Preferred name",
            120,
          ),

        p_circle_name:
          optionalText(
            input.circleName,
            "Circle name",
            180,
          ),

        p_creator_role:
          input.creatorRole,

        p_relationship:
          requiredText(
            input.relationship,
            "Relationship",
            2,
            160,
          ),

        p_authority_type:
          input.authorityType,

        p_authority_basis:
          requiredText(
            input.authorityBasis,
            "Authority or consent basis",
            10,
            1000,
          ),

        p_authority_confirmed:
          true,
      },
    );

  if (error) {
    throw describeDatabaseError(
      error,
      "The participant Circle could not be created.",
    );
  }

  return readWorkspaceResponse(
    data,
    user,
  );
}

export async function openSelectedSecureCircle(
  circleId: string,
): Promise<SecureCircleOpenResult> {
  const cleanCircleId =
    requiredUuid(
      circleId,
      "Circle",
    );

  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  const { data, error } =
    await supabase.rpc(
      "sm_open_selected_circle",
      {
        selected_circle_id:
          cleanCircleId,
      },
    );

  if (error) {
    throw describeDatabaseError(
      error,
      "The selected Circle could not be opened.",
    );
  }

  return readWorkspaceResponse(
    data,
    user,
  );
}