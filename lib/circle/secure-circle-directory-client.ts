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
  };

type UnknownRecord = Record<string, unknown>;

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

    const parts = [
      candidate.message,
      candidate.details,
      candidate.hint,
      candidate.code
        ? `Code: ${String(candidate.code)}`
        : null,
    ].filter(
      (value): value is string =>
        typeof value === "string" &&
        value.trim().length > 0,
    );

    if (parts.length > 0) {
      return new Error(parts.join(" "));
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

  return circles.map(readDirectoryEntry);
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

  return {
    user,

    participant:
      participant as unknown as SecureParticipant,

    circle:
      circle as unknown as SecureCircle,

    membership:
      membership as unknown as SecureCircleMember,

    privateAccess: true,

    created: response.created === true,
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

export async function openSelectedSecureCircle(
  circleId: string,
): Promise<SecureCircleOpenResult> {
  const cleanCircleId =
    circleId.trim();

  if (!cleanCircleId) {
    throw new Error(
      "Choose a Circle to continue.",
    );
  }

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