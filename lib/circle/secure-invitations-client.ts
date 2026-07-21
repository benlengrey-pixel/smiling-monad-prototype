"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type SecureCircleInvitation = {
  id: string;
  circle_id: string;
  user_id: string | null;
  invited_email: string;
  display_name: string;
  role:
    | "participant"
    | "nominee"
    | "family"
    | "support_worker"
    | "support_coordinator"
    | "professional"
    | "circle_manager"
    | "circle_member";
  relationship: string;
  membership_status:
    | "invited"
    | "active"
    | "suspended"
    | "removed"
    | "declined";
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  removed_at: string | null;
  access_starts_at: string | null;
  access_ends_at: string | null;
  created_at: string;
  updated_at: string;
};

function describeError(error: unknown): string {
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

  return "The Circle invitation request could not be completed.";
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

export async function readMySecureCircleInvitations(): Promise<
  SecureCircleInvitation[]
> {
  await requireSignedInUser();

  const supabase =
    getSupabaseBrowserClient();

  const { data, error } =
    await supabase.rpc(
      "sm_list_my_circle_invitations",
    );

  if (error) {
    throw new Error(
      describeError(error),
    );
  }

  return (
    data ?? []
  ) as SecureCircleInvitation[];
}

export async function acceptSecureCircleInvitation(
  memberId: string,
): Promise<SecureCircleInvitation> {
  const cleanMemberId =
    memberId.trim();

  if (!cleanMemberId) {
    throw new Error(
      "A Circle invitation must be selected.",
    );
  }

  await requireSignedInUser();

  const supabase =
    getSupabaseBrowserClient();

  const { data, error } =
    await supabase.rpc(
      "sm_accept_circle_invitation",
      {
        requested_member_id:
          cleanMemberId,
      },
    );

  if (error) {
    throw new Error(
      describeError(error),
    );
  }

  if (!data) {
    throw new Error(
      "The Circle invitation could not be accepted.",
    );
  }

  return data as SecureCircleInvitation;
}