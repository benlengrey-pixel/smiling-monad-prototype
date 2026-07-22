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
  privateAccess: boolean;
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

type WorkspaceDatabaseResult = {
  participant: SecureParticipant;
  circle: SecureCircle;
  membership: SecureCircleMember;
  privateAccess: boolean;
};

type WorkspaceRpcResult = {
  participant: SecureParticipant;
  circle: SecureCircle;
  membership: SecureCircleMember;
  created: boolean;
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
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  return cleaned;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readWorkspaceRpcResult(
  value: unknown,
): WorkspaceRpcResult {
  if (!isRecord(value)) {
    throw new Error(
      "The Circle workspace response was invalid.",
    );
  }

  const participant = value.participant;
  const circle = value.circle;
  const membership = value.membership;

  if (
    !isRecord(participant) ||
    !isRecord(circle) ||
    !isRecord(membership)
  ) {
    throw new Error(
      "The Circle workspace response was incomplete.",
    );
  }

  return {
    participant:
      participant as unknown as SecureParticipant,
    circle:
      circle as unknown as SecureCircle,
    membership:
      membership as unknown as SecureCircleMember,
    created: value.created === true,
  };
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

async function hasPrivateAccess(
  supabase: SupabaseClient,
): Promise<boolean> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return false;
  }

  /*
   * Row Level Security remains responsible for deciding
   * which Circle and participant records this signed-in
   * user may access.
   *
   * Passkey confirmation is required separately for
   * sensitive actions such as recording or withdrawing
   * privacy consent. Passkey sessions are not represented
   * by Supabase as AAL2, so an AAL2-only read gate would
   * incorrectly hide valid Circle records after successful
   * fingerprint, face or device-PIN confirmation.
   */
  return true;
}

function createPrivateParticipantPlaceholder(
  membership: SecureCircleMember,
): SecureParticipant {
  return {
    id: "",
    created_by: "",
    full_name:
      "Private participant information",
    preferred_name: "",
    status: "active",
    date_of_birth: null,
    pronouns: "",
    contact_email: "",
    contact_phone: "",
    what_matters: "",
    communication_support: "",
    decision_support: "",
    created_at: membership.created_at,
    updated_at: membership.updated_at,
  };
}

function createLimitedCircle(
  membership: SecureCircleMember,
): SecureCircle {
  return {
    id: membership.circle_id,
    participant_id: "",
    created_by:
      membership.invited_by ?? "",
    name: "Circle of Support",
    status: "active",
    purpose:
      "People and relationships",
    created_at: membership.created_at,
    updated_at: membership.updated_at,
  };
}

async function findActiveMembership(
  supabase: SupabaseClient,
  user: User,
): Promise<SecureCircleMember | null> {
  const {
    data,
    error,
  } = await supabase
    .from("circle_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("membership_status", "active")
    .or(
      `access_starts_at.is.null,access_starts_at.lte.${new Date().toISOString()}`,
    )
    .order("created_at", {
      ascending: true,
    })
    .limit(1);

  if (error) {
    throw error;
  }

  const membership =
    data && data.length > 0
      ? (data[0] as unknown as SecureCircleMember)
      : null;

  if (!membership) {
    return null;
  }

  if (
    membership.access_ends_at &&
    new Date(
      membership.access_ends_at,
    ).getTime() <= Date.now()
  ) {
    return null;
  }

  return membership;
}

async function loadPrivateWorkspace(
  supabase: SupabaseClient,
  membership: SecureCircleMember,
): Promise<WorkspaceDatabaseResult> {
  const {
    data: circleData,
    error: circleError,
  } = await supabase
    .from("circles")
    .select("*")
    .eq("id", membership.circle_id)
    .maybeSingle();

  if (circleError) {
    throw circleError;
  }

  if (!circleData) {
    return {
      participant:
        createPrivateParticipantPlaceholder(
          membership,
        ),
      circle:
        createLimitedCircle(
          membership,
        ),
      membership,
      privateAccess: false,
    };
  }

  const circle =
    circleData as unknown as SecureCircle;

  const {
    data: participantData,
    error: participantError,
  } = await supabase
    .from("participants")
    .select("*")
    .eq(
      "id",
      circle.participant_id,
    )
    .maybeSingle();

  if (participantError) {
    throw participantError;
  }

  if (!participantData) {
    return {
      participant:
        createPrivateParticipantPlaceholder(
          membership,
        ),
      circle,
      membership,
      privateAccess: false,
    };
  }

  return {
    participant:
      participantData as unknown as SecureParticipant,
    circle,
    membership,
    privateAccess: true,
  };
}

async function findExistingWorkspace(
  supabase: SupabaseClient,
  user: User,
): Promise<WorkspaceDatabaseResult | null> {
  const membership =
    await findActiveMembership(
      supabase,
      user,
    );

  if (!membership) {
    return null;
  }

  const privateAccess =
    await hasPrivateAccess(
      supabase,
    );

  if (!privateAccess) {
    return {
      participant:
        createPrivateParticipantPlaceholder(
          membership,
        ),
      circle:
        createLimitedCircle(
          membership,
        ),
      membership,
      privateAccess: false,
    };
  }

  return loadPrivateWorkspace(
    supabase,
    membership,
  );
}

async function createWorkspaceWithRpc(
  supabase: SupabaseClient,
): Promise<WorkspaceDatabaseResult> {
  const privateAccess =
    await hasPrivateAccess(
      supabase,
    );

  if (!privateAccess) {
    throw new Error(
      "No active Circle invitation was found for this account.",
    );
  }

  const { data, error } =
    await supabase.rpc(
      "sm_open_or_create_circle_workspace",
    );

  if (error) {
    throw error;
  }

  const workspace =
    readWorkspaceRpcResult(data);

  return {
    participant:
      workspace.participant,
    circle:
      workspace.circle,
    membership:
      workspace.membership,
    privateAccess: true,
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
    (await createWorkspaceWithRpc(
      supabase,
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

  await requireAuthenticatedUser(
    supabase,
  );

  const privateAccess =
    await hasPrivateAccess(
      supabase,
    );

  if (!privateAccess) {
    throw new Error(
      "Complete the security check before changing private participant information.",
    );
  }

  if (!participantId) {
    throw new Error(
      "Private participant information is not open.",
    );
  }

  const fullName =
    requireText(
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
      preferred_name:
        preferredName,
      pronouns:
        update.pronouns?.trim() ??
        "",
      contact_email:
        update.contactEmail?.trim() ??
        "",
      contact_phone:
        update.contactPhone?.trim() ??
        "",
      what_matters:
        update.whatMatters.trim(),
      communication_support:
        update.communicationSupport.trim(),
      decision_support:
        update.decisionSupport?.trim() ??
        "",
    })
    .eq("id", participantId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "The participant profile could not be updated.",
    );
  }

  return data as unknown as SecureParticipant;
}