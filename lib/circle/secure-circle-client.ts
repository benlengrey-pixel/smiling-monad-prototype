import type {
  SupabaseClient,
  User,
} from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type SecureParticipant = {
  id: string;
  created_by: string;
  full_name: string;
  preferred_name: string;
  status: "active" | "inactive" | "archived";
  date_of_birth: string | null;
  pronouns: string;
  contact_email: string;
  contact_phone: string;
  what_matters: string;
  communication_support: string;
  decision_support: string;
  created_at: string;
  updated_at: string;
};

export type SecureCircle = {
  id: string;
  participant_id: string;
  created_by: string;
  name: string;
  status: "active" | "paused" | "archived";
  purpose: string;
  created_at: string;
  updated_at: string;
};

export type SecureCircleMember = {
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

export type SecureCircleWorkspace = {
  user: User;
  participant: SecureParticipant;
  circle: SecureCircle;
  membership: SecureCircleMember;
};

export type SecureParticipantProfileUpdate = {
  fullName: string;
  preferredName: string;
  pronouns?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatMatters: string;
  communicationSupport: string;
  decisionSupport?: string;
};

type BootstrapResult = {
  participant: SecureParticipant;
  circle: SecureCircle;
  membership: SecureCircleMember;
};

function getClient(): SupabaseClient {
  return getSupabaseBrowserClient();
}

function requireText(
  value: string,
  fieldName: string,
): string {
  const cleaned = value.trim();

  if (!cleaned) {
    throw new Error(`${fieldName} is required.`);
  }

  return cleaned;
}

async function requireAuthenticatedUser(
  supabase: SupabaseClient,
): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      "You must be signed in to open a Circle of Support.",
    );
  }

  return user;
}

async function findExistingWorkspace(
  supabase: SupabaseClient,
  user: User,
): Promise<BootstrapResult | null> {
  const {
    data: memberships,
    error: membershipError,
  } = await supabase
    .from("circle_members")
    .select(
      [
        "id",
        "circle_id",
        "user_id",
        "invited_email",
        "display_name",
        "role",
        "relationship",
        "membership_status",
        "invited_by",
        "invited_at",
        "accepted_at",
        "removed_at",
        "access_starts_at",
        "access_ends_at",
        "created_at",
        "updated_at",
      ].join(","),
    )
    .eq("user_id", user.id)
    .eq("membership_status", "active")
    .order("created_at", {
      ascending: true,
    })
    .limit(1);

  if (membershipError) {
    throw membershipError;
  }

  const membership =
    memberships?.[0] as
      | SecureCircleMember
      | undefined;

  if (!membership) {
    return null;
  }

  const {
    data: circle,
    error: circleError,
  } = await supabase
    .from("circles")
    .select("*")
    .eq("id", membership.circle_id)
    .single();

  if (circleError) {
    throw circleError;
  }

  const {
    data: participant,
    error: participantError,
  } = await supabase
    .from("participants")
    .select("*")
    .eq(
      "id",
      (circle as SecureCircle).participant_id,
    )
    .single();

  if (participantError) {
    throw participantError;
  }

  return {
    participant:
      participant as SecureParticipant,
    circle: circle as SecureCircle,
    membership,
  };
}

async function createWorkspace(
  supabase: SupabaseClient,
  user: User,
): Promise<BootstrapResult> {
  const defaultDisplayName =
    typeof user.user_metadata?.full_name ===
      "string" &&
    user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email?.split("@")[0] ||
        "Circle owner";

  const participantId =
    globalThis.crypto.randomUUID();

  const circleId =
    globalThis.crypto.randomUUID();

  const {
    data: participant,
    error: participantError,
  } = await supabase
    .from("participants")
    .insert({
      id: participantId,
      created_by: user.id,
      full_name: defaultDisplayName,
      preferred_name: defaultDisplayName,
      status: "active",
      what_matters: "",
      communication_support: "",
      decision_support: "",
    })
    .select()
    .single();

  if (participantError) {
    throw participantError;
  }

  const {
    data: circle,
    error: circleError,
  } = await supabase
    .from("circles")
    .insert({
      id: circleId,
      participant_id: participantId,
      created_by: user.id,
      name: `${defaultDisplayName}'s Circle of Support`,
      status: "active",
      purpose:
        "Coordinate support around the life, choices and goals of the person.",
    })
    .select()
    .single();

  if (circleError) {
    throw circleError;
  }

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from("circle_members")
    .insert({
      circle_id: circleId,
      user_id: user.id,
      display_name: defaultDisplayName,
      role: "circle_manager",
      relationship: "Circle creator",
      membership_status: "active",
      invited_by: user.id,
      accepted_at:
        new Date().toISOString(),
      access_starts_at:
        new Date().toISOString(),
    })
    .select()
    .single();

  if (membershipError) {
    throw membershipError;
  }

  return {
    participant:
      participant as SecureParticipant,
    circle: circle as SecureCircle,
    membership:
      membership as SecureCircleMember,
  };
}

export async function openSecureCircleWorkspace(): Promise<SecureCircleWorkspace> {
  const supabase = getClient();
  const user =
    await requireAuthenticatedUser(
      supabase,
    );

  const existingWorkspace =
    await findExistingWorkspace(
      supabase,
      user,
    );

  const workspace =
    existingWorkspace ??
    (await createWorkspace(
      supabase,
      user,
    ));

  return {
    user,
    ...workspace,
  };
}

export async function refreshSecureCircleWorkspace(): Promise<SecureCircleWorkspace> {
  const supabase = getClient();
  const user =
    await requireAuthenticatedUser(
      supabase,
    );

  const workspace =
    await findExistingWorkspace(
      supabase,
      user,
    );

  if (!workspace) {
    throw new Error(
      "No active Circle of Support was found for this account.",
    );
  }

  return {
    user,
    ...workspace,
  };
}

export async function updateSecureParticipantProfile(
  participantId: string,
  update: SecureParticipantProfileUpdate,
): Promise<SecureParticipant> {
  const supabase = getClient();
  const user =
    await requireAuthenticatedUser(
      supabase,
    );

  const fullName = requireText(
    update.fullName,
    "Full name",
  );

  const preferredName =
    update.preferredName.trim() ||
    fullName;

  const {
    data,
    error,
  } = await supabase
    .from("participants")
    .update({
      full_name: fullName,
      preferred_name: preferredName,
      pronouns:
        update.pronouns?.trim() ?? "",
      contact_email:
        update.contactEmail?.trim() ?? "",
      contact_phone:
        update.contactPhone?.trim() ?? "",
      what_matters:
        update.whatMatters.trim(),
      communication_support:
        update.communicationSupport.trim(),
      decision_support:
        update.decisionSupport?.trim() ??
        "",
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", participantId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "The participant profile could not be updated.",
    );
  }

  void user;

  return data as SecureParticipant;
}