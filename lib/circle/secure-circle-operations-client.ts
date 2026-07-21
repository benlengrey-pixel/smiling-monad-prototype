"use client";

import type {
  SupabaseClient,
  User,
} from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type SecureMemberRole =
  | "participant"
  | "nominee"
  | "family"
  | "support_worker"
  | "support_coordinator"
  | "professional"
  | "circle_manager"
  | "circle_member";

export type SecureCircleMemberRecord = {
  id: string;
  circle_id: string;
  user_id: string | null;
  invited_email: string;
  display_name: string;
  role: SecureMemberRole;
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

export type SecureCircleMeeting = {
  id: string;
  circle_id: string;
  participant_id: string;
  title: string;
  meeting_date: string | null;
  purpose: string;
  meeting_status:
    | "planned"
    | "completed"
    | "cancelled"
    | "archived";
  notes: string;
  created_by: string;
  updated_by: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SecureCircleResponsibility = {
  id: string;
  circle_id: string;
  participant_id: string;
  title: string;
  owner_name: string;
  responsibility_status:
    | "open"
    | "in_progress"
    | "complete"
    | "archived";
  due_date: string | null;
  notes: string;
  created_by: string;
  updated_by: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SecureCircleBudgetItem = {
  id: string;
  circle_id: string;
  participant_id: string;
  title: string;
  category:
    | "core"
    | "capacity_building"
    | "capital"
    | "other";
  allocated: number;
  spent: number;
  owner_name: string;
  budget_status:
    | "active"
    | "review_needed"
    | "closed"
    | "archived";
  notes: string;
  created_by: string;
  updated_by: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

function getClient(): SupabaseClient {
  return getSupabaseBrowserClient();
}

function required(
  value: string,
  label: string,
): string {
  const clean = value.trim();

  if (!clean) {
    throw new Error(`${label} is required.`);
  }

  return clean;
}

function openSignIn(returnTo: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(
    `/sign-in?returnTo=${encodeURIComponent(
      returnTo,
    )}`,
  );
}

function openMfa(returnTo: string): void {
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
  returnTo = "/circle",
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

async function hasAal2(
  supabase: SupabaseClient,
): Promise<boolean> {
  const {
    data: assurance,
    error,
  } =
    await supabase.auth.mfa
      .getAuthenticatorAssuranceLevel();

  if (error) {
    return false;
  }

  return (
    assurance.currentLevel === "aal2"
  );
}

async function requireAal2(
  supabase: SupabaseClient,
  returnTo: string,
): Promise<User> {
  const user = await requireUser(
    supabase,
    returnTo,
  );

  const secure = await hasAal2(
    supabase,
  );

  if (!secure) {
    openMfa(returnTo);

    throw new Error(
      "Opening the security check…",
    );
  }

  return user;
}

function friendlyDatabaseError(
  message: string,
): Error {
  const lowerMessage =
    message.toLowerCase();

  if (
    lowerMessage.includes(
      "sm_require_aal2",
    )
  ) {
    return new Error(
      "A security check is required before changing private participant information.",
    );
  }

  if (
    lowerMessage.includes(
      "row-level security",
    )
  ) {
    return new Error(
      "You do not have permission to make this change.",
    );
  }

  if (
    lowerMessage.includes(
      "duplicate key",
    ) ||
    lowerMessage.includes(
      "unique constraint",
    )
  ) {
    return new Error(
      "This person already has a Circle invitation.",
    );
  }

  return new Error(message);
}

export async function readSecureCircleOperations(
  circleId: string,
): Promise<{
  members: SecureCircleMemberRecord[];
  meetings: SecureCircleMeeting[];
  responsibilities: SecureCircleResponsibility[];
  budgets: SecureCircleBudgetItem[];
}> {
  const supabase = getClient();

  await requireUser(
    supabase,
    "/circle",
  );

  const membersResult =
    await supabase
      .from("circle_members")
      .select("*")
      .eq("circle_id", circleId)
      .neq(
        "membership_status",
        "removed",
      )
      .order("created_at");

  if (membersResult.error) {
    throw friendlyDatabaseError(
      membersResult.error.message,
    );
  }

  const secure = await hasAal2(
    supabase,
  );

  if (!secure) {
    return {
      members:
        (membersResult.data ??
          []) as unknown as SecureCircleMemberRecord[],
      meetings: [],
      responsibilities: [],
      budgets: [],
    };
  }

  const [
    meetingsResult,
    responsibilitiesResult,
    budgetsResult,
  ] = await Promise.all([
    supabase
      .from("circle_meetings")
      .select("*")
      .eq("circle_id", circleId)
      .neq(
        "meeting_status",
        "archived",
      )
      .order("meeting_date"),

    supabase
      .from(
        "circle_responsibilities",
      )
      .select("*")
      .eq("circle_id", circleId)
      .neq(
        "responsibility_status",
        "archived",
      )
      .order("created_at"),

    supabase
      .from("circle_budget_items")
      .select("*")
      .eq("circle_id", circleId)
      .neq(
        "budget_status",
        "archived",
      )
      .order("created_at"),
  ]);

  for (const result of [
    meetingsResult,
    responsibilitiesResult,
    budgetsResult,
  ]) {
    if (result.error) {
      throw friendlyDatabaseError(
        result.error.message,
      );
    }
  }

  return {
    members:
      (membersResult.data ??
        []) as unknown as SecureCircleMemberRecord[],

    meetings:
      (meetingsResult.data ??
        []) as unknown as SecureCircleMeeting[],

    responsibilities:
      (responsibilitiesResult.data ??
        []) as unknown as SecureCircleResponsibility[],

    budgets:
      (budgetsResult.data ??
        []) as unknown as SecureCircleBudgetItem[],
  };
}

export async function inviteSecureCircleMember(
  input: {
    circleId: string;
    email: string;
    displayName: string;
    role: SecureMemberRole;
    relationship: string;
  },
): Promise<SecureCircleMemberRecord> {
  const cleanEmail =
    required(
      input.email,
      "Email",
    ).toLowerCase();

  const cleanName =
    required(
      input.displayName,
      "Name",
    );

  const supabase = getClient();

  const user = await requireUser(
    supabase,
    "/circle?panel=members",
  );

  const { data, error } =
    await supabase
      .from("circle_members")
      .insert({
        circle_id: input.circleId,
        user_id: null,
        invited_email: cleanEmail,
        display_name: cleanName,
        role: input.role,
        relationship:
          input.relationship.trim(),
        membership_status:
          "invited",
        invited_by: user.id,
      })
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error.message,
    );
  }

  return data as unknown as SecureCircleMemberRecord;
}

export async function updateSecureCircleMember(
  memberId: string,
  update: Partial<
    Pick<
      SecureCircleMemberRecord,
      | "display_name"
      | "role"
      | "relationship"
      | "membership_status"
      | "access_starts_at"
      | "access_ends_at"
    >
  >,
): Promise<SecureCircleMemberRecord> {
  const supabase = getClient();

  await requireUser(
    supabase,
    "/circle?panel=members",
  );

  const { data, error } =
    await supabase
      .from("circle_members")
      .update(update)
      .eq("id", memberId)
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error.message,
    );
  }

  return data as unknown as SecureCircleMemberRecord;
}

export async function createSecureMeeting(
  input: {
    circleId: string;
    participantId: string;
    title: string;
    meetingDate?: string;
    purpose?: string;
  },
): Promise<SecureCircleMeeting> {
  const supabase = getClient();

  const user = await requireAal2(
    supabase,
    "/circle?panel=meetings",
  );

  const { data, error } =
    await supabase
      .from("circle_meetings")
      .insert({
        circle_id: input.circleId,
        participant_id:
          input.participantId,
        title: required(
          input.title,
          "Meeting title",
        ),
        meeting_date:
          input.meetingDate || null,
        purpose:
          input.purpose?.trim() ??
          "",
        created_by: user.id,
        updated_by: user.id,
      })
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error.message,
    );
  }

  return data as unknown as SecureCircleMeeting;
}

export async function updateSecureMeeting(
  id: string,
  update: Partial<
    Pick<
      SecureCircleMeeting,
      | "title"
      | "meeting_date"
      | "purpose"
      | "meeting_status"
      | "notes"
    >
  >,
): Promise<SecureCircleMeeting> {
  const supabase = getClient();

  const user = await requireAal2(
    supabase,
    "/circle?panel=meetings",
  );

  const { data, error } =
    await supabase
      .from("circle_meetings")
      .update({
        ...update,
        updated_by: user.id,
      })
      .eq("id", id)
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error.message,
    );
  }

  return data as unknown as SecureCircleMeeting;
}

export async function createSecureResponsibility(
  input: {
    circleId: string;
    participantId: string;
    title: string;
    ownerName?: string;
  },
): Promise<SecureCircleResponsibility> {
  const supabase = getClient();

  const user = await requireAal2(
    supabase,
    "/circle?panel=responsibilities",
  );

  const { data, error } =
    await supabase
      .from(
        "circle_responsibilities",
      )
      .insert({
        circle_id: input.circleId,
        participant_id:
          input.participantId,
        title: required(
          input.title,
          "Responsibility",
        ),
        owner_name:
          input.ownerName?.trim() ??
          "",
        created_by: user.id,
        updated_by: user.id,
      })
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error.message,
    );
  }

  return data as unknown as SecureCircleResponsibility;
}

export async function updateSecureResponsibility(
  id: string,
  update: Partial<
    Pick<
      SecureCircleResponsibility,
      | "title"
      | "owner_name"
      | "responsibility_status"
      | "due_date"
      | "notes"
    >
  >,
): Promise<SecureCircleResponsibility> {
  const supabase = getClient();

  const user = await requireAal2(
    supabase,
    "/circle?panel=responsibilities",
  );

  const { data, error } =
    await supabase
      .from(
        "circle_responsibilities",
      )
      .update({
        ...update,
        updated_by: user.id,
      })
      .eq("id", id)
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error.message,
    );
  }

  return data as unknown as SecureCircleResponsibility;
}

export async function createSecureBudgetItem(
  input: {
    circleId: string;
    participantId: string;
    title: string;
    category:
      SecureCircleBudgetItem["category"];
    allocated: number;
    spent: number;
    ownerName?: string;
  },
): Promise<SecureCircleBudgetItem> {
  const supabase = getClient();

  const user = await requireAal2(
    supabase,
    "/circle?panel=budget",
  );

  const { data, error } =
    await supabase
      .from("circle_budget_items")
      .insert({
        circle_id: input.circleId,
        participant_id:
          input.participantId,
        title: required(
          input.title,
          "Budget title",
        ),
        category: input.category,
        allocated: input.allocated,
        spent: input.spent,
        owner_name:
          input.ownerName?.trim() ??
          "",
        created_by: user.id,
        updated_by: user.id,
      })
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error.message,
    );
  }

  return data as unknown as SecureCircleBudgetItem;
}

export async function updateSecureBudgetItem(
  id: string,
  update: Partial<
    Pick<
      SecureCircleBudgetItem,
      | "title"
      | "category"
      | "allocated"
      | "spent"
      | "owner_name"
      | "budget_status"
      | "notes"
    >
  >,
): Promise<SecureCircleBudgetItem> {
  const supabase = getClient();

  const user = await requireAal2(
    supabase,
    "/circle?panel=budget",
  );

  const { data, error } =
    await supabase
      .from("circle_budget_items")
      .update({
        ...update,
        updated_by: user.id,
      })
      .eq("id", id)
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error.message,
    );
  }

  return data as unknown as SecureCircleBudgetItem;
}