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
  circle?: {
    id: string;
    name: string;
    purpose: string;
  } | null;
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
    await supabase
      .from("circle_members")
      .select(
        `
          *,
          circle:circles (
            id,
            name,
            purpose
          )
        `,
      )
      .eq(
        "membership_status",
        "invited",
      )
      .order(
        "invited_at",
        { ascending: false },
      );

  if (error) {
    throw new Error(
      describeError(error),
    );
  }

  return (
    data ?? []
  ) as unknown as SecureCircleInvitation[];
}

async function respondToSecureCircleInvitation(
  memberId: string,
  response: "accept" | "decline",
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
      "respond_to_circle_invitation",
      {
        invitation_id:
          cleanMemberId,
        invitation_response:
          response,
      },
    );

  if (error) {
    throw new Error(
      describeError(error),
    );
  }

  if (!data) {
    throw new Error(
      response === "accept"
        ? "The Circle invitation could not be accepted."
        : "The Circle invitation could not be declined.",
    );
  }

  return data as SecureCircleInvitation;
}

export async function acceptSecureCircleInvitation(
  memberId: string,
): Promise<SecureCircleInvitation> {
  return respondToSecureCircleInvitation(
    memberId,
    "accept",
  );
}

export async function declineSecureCircleInvitation(
  memberId: string,
): Promise<SecureCircleInvitation> {
  return respondToSecureCircleInvitation(
    memberId,
    "decline",
  );
}