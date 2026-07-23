"use client";

import type {
  SupabaseClient,
  User,
} from "@supabase/supabase-js";

import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

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
  returnTo = "/circle",
): Promise<User> {
  const {
    data: { user },
    error,
  } =
    await supabase.auth.getUser();

  if (error || !user) {
    openSignIn(returnTo);

    throw new Error(
      "Please sign in to continue.",
    );
  }

  return user;
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

function validEmail(
  value: string,
): string {
  const clean =
    requiredText(
      value,
      "Email",
    ).toLowerCase();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      clean,
    )
  ) {
    throw new Error(
      "Enter a valid email address.",
    );
  }

  return clean;
}

function optionalDateTime(
  value: string | null | undefined,
  label: string,
): string | null {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    throw new Error(
      `${label} is not valid.`,
    );
  }

  return date.toISOString();
}

function optionalDate(
  value: string | null | undefined,
  label: string,
): string | null {
  if (!value?.trim()) {
    return null;
  }

  const clean = value.trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      clean,
    )
  ) {
    throw new Error(
      `${label} is not valid.`,
    );
  }

  return clean;
}

function moneyValue(
  value: number,
  label: string,
): number {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be zero or more.`,
    );
  }

  return Math.round(
    value * 100,
  ) / 100;
}

function friendlyDatabaseError(
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
        "You do not have permission to make this Circle change.",
      );
    }

    if (
      combined.includes(
        "duplicate key",
      ) ||
      combined.includes(
        "unique constraint",
      )
    ) {
      return new Error(
        "This person already has a Circle invitation.",
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

export async function readSecureCircleOperations(
  circleId: string,
): Promise<{
  members:
    SecureCircleMemberRecord[];
  meetings:
    SecureCircleMeeting[];
  responsibilities:
    SecureCircleResponsibility[];
  budgets:
    SecureCircleBudgetItem[];
}> {
  const supabase = getClient();

  await requireUser(
    supabase,
    "/circle",
  );

  const cleanCircleId =
    requiredId(circleId, "Circle");

  const [
    membersResult,
    meetingsResult,
    responsibilitiesResult,
    budgetsResult,
  ] = await Promise.all([
    supabase
      .from("circle_members")
      .select("*")
      .eq(
        "circle_id",
        cleanCircleId,
      )
      .neq(
        "membership_status",
        "removed",
      )
      .order("created_at"),

    supabase
      .from("circle_meetings")
      .select("*")
      .eq(
        "circle_id",
        cleanCircleId,
      )
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
      .eq(
        "circle_id",
        cleanCircleId,
      )
      .neq(
        "responsibility_status",
        "archived",
      )
      .order("created_at"),

    supabase
      .from(
        "circle_budget_items",
      )
      .select("*")
      .eq(
        "circle_id",
        cleanCircleId,
      )
      .neq(
        "budget_status",
        "archived",
      )
      .order("created_at"),
  ]);

  for (
    const result of [
      membersResult,
      meetingsResult,
      responsibilitiesResult,
      budgetsResult,
    ]
  ) {
    if (result.error) {
      throw friendlyDatabaseError(
        result.error,
        "Circle operations could not be loaded.",
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
  const supabase = getClient();

  const user = await requireUser(
    supabase,
    "/circle?panel=members",
  );

  const { data, error } =
    await supabase
      .from("circle_members")
      .insert({
        circle_id:
          requiredId(
            input.circleId,
            "Circle",
          ),
        user_id: null,
        invited_email:
          validEmail(input.email),
        display_name:
          requiredText(
            input.displayName,
            "Name",
          ),
        role: input.role,
        relationship:
          input.relationship.trim(),
        membership_status:
          "invited",
        invited_by:
          user.id,
      })
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error,
      "The Circle invitation could not be created.",
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

  const cleanUpdate: Record<
    string,
    unknown
  > = {};

  if (
    update.display_name !==
    undefined
  ) {
    cleanUpdate.display_name =
      requiredText(
        update.display_name,
        "Name",
      );
  }

  if (update.role !== undefined) {
    cleanUpdate.role =
      update.role;
  }

  if (
    update.relationship !==
    undefined
  ) {
    cleanUpdate.relationship =
      update.relationship.trim();
  }

  if (
    update.membership_status !==
    undefined
  ) {
    cleanUpdate.membership_status =
      update.membership_status;
  }

  if (
    update.access_starts_at !==
    undefined
  ) {
    cleanUpdate.access_starts_at =
      optionalDateTime(
        update.access_starts_at,
        "Access start",
      );
  }

  if (
    update.access_ends_at !==
    undefined
  ) {
    cleanUpdate.access_ends_at =
      optionalDateTime(
        update.access_ends_at,
        "Access end",
      );
  }

  if (
    Object.keys(cleanUpdate)
      .length === 0
  ) {
    throw new Error(
      "No member changes were provided.",
    );
  }

  const { data, error } =
    await supabase
      .from("circle_members")
      .update(cleanUpdate)
      .eq(
        "id",
        requiredId(
          memberId,
          "Circle member",
        ),
      )
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error,
      "The Circle member could not be updated.",
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

  const user = await requireUser(
    supabase,
    "/circle?panel=meetings",
  );

  const { data, error } =
    await supabase
      .from("circle_meetings")
      .insert({
        circle_id:
          requiredId(
            input.circleId,
            "Circle",
          ),
        participant_id:
          requiredId(
            input.participantId,
            "Participant",
          ),
        title:
          requiredText(
            input.title,
            "Meeting title",
          ),
        meeting_date:
          optionalDateTime(
            input.meetingDate,
            "Meeting date",
          ),
        purpose:
          input.purpose?.trim() ??
          "",
        created_by:
          user.id,
        updated_by:
          user.id,
      })
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error,
      "The meeting could not be created.",
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

  const user = await requireUser(
    supabase,
    "/circle?panel=meetings",
  );

  const cleanUpdate: Record<
    string,
    unknown
  > = {
    updated_by: user.id,
  };

  if (update.title !== undefined) {
    cleanUpdate.title =
      requiredText(
        update.title,
        "Meeting title",
      );
  }

  if (
    update.meeting_date !==
    undefined
  ) {
    cleanUpdate.meeting_date =
      optionalDateTime(
        update.meeting_date,
        "Meeting date",
      );
  }

  if (
    update.purpose !== undefined
  ) {
    cleanUpdate.purpose =
      update.purpose.trim();
  }

  if (
    update.meeting_status !==
    undefined
  ) {
    cleanUpdate.meeting_status =
      update.meeting_status;

    cleanUpdate.archived_at =
      update.meeting_status ===
      "archived"
        ? new Date().toISOString()
        : null;
  }

  if (update.notes !== undefined) {
    cleanUpdate.notes =
      update.notes.trim();
  }

  const { data, error } =
    await supabase
      .from("circle_meetings")
      .update(cleanUpdate)
      .eq(
        "id",
        requiredId(id, "Meeting"),
      )
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error,
      "The meeting could not be updated.",
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

  const user = await requireUser(
    supabase,
    "/circle?panel=responsibilities",
  );

  const { data, error } =
    await supabase
      .from(
        "circle_responsibilities",
      )
      .insert({
        circle_id:
          requiredId(
            input.circleId,
            "Circle",
          ),
        participant_id:
          requiredId(
            input.participantId,
            "Participant",
          ),
        title:
          requiredText(
            input.title,
            "Responsibility",
          ),
        owner_name:
          input.ownerName?.trim() ??
          "",
        created_by:
          user.id,
        updated_by:
          user.id,
      })
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error,
      "The responsibility could not be created.",
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

  const user = await requireUser(
    supabase,
    "/circle?panel=responsibilities",
  );

  const cleanUpdate: Record<
    string,
    unknown
  > = {
    updated_by: user.id,
  };

  if (update.title !== undefined) {
    cleanUpdate.title =
      requiredText(
        update.title,
        "Responsibility",
      );
  }

  if (
    update.owner_name !==
    undefined
  ) {
    cleanUpdate.owner_name =
      update.owner_name.trim();
  }

  if (
    update.responsibility_status !==
    undefined
  ) {
    cleanUpdate.responsibility_status =
      update.responsibility_status;

    cleanUpdate.archived_at =
      update.responsibility_status ===
      "archived"
        ? new Date().toISOString()
        : null;
  }

  if (
    update.due_date !== undefined
  ) {
    cleanUpdate.due_date =
      optionalDate(
        update.due_date,
        "Due date",
      );
  }

  if (update.notes !== undefined) {
    cleanUpdate.notes =
      update.notes.trim();
  }

  const { data, error } =
    await supabase
      .from(
        "circle_responsibilities",
      )
      .update(cleanUpdate)
      .eq(
        "id",
        requiredId(
          id,
          "Responsibility",
        ),
      )
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error,
      "The responsibility could not be updated.",
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

  const user = await requireUser(
    supabase,
    "/circle?panel=budget",
  );

  const { data, error } =
    await supabase
      .from(
        "circle_budget_items",
      )
      .insert({
        circle_id:
          requiredId(
            input.circleId,
            "Circle",
          ),
        participant_id:
          requiredId(
            input.participantId,
            "Participant",
          ),
        title:
          requiredText(
            input.title,
            "Budget title",
          ),
        category:
          input.category,
        allocated:
          moneyValue(
            input.allocated,
            "Allocated amount",
          ),
        spent:
          moneyValue(
            input.spent,
            "Spent amount",
          ),
        owner_name:
          input.ownerName?.trim() ??
          "",
        created_by:
          user.id,
        updated_by:
          user.id,
      })
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error,
      "The budget item could not be created.",
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

  const user = await requireUser(
    supabase,
    "/circle?panel=budget",
  );

  const cleanUpdate: Record<
    string,
    unknown
  > = {
    updated_by: user.id,
  };

  if (update.title !== undefined) {
    cleanUpdate.title =
      requiredText(
        update.title,
        "Budget title",
      );
  }

  if (
    update.category !== undefined
  ) {
    cleanUpdate.category =
      update.category;
  }

  if (
    update.allocated !== undefined
  ) {
    cleanUpdate.allocated =
      moneyValue(
        update.allocated,
        "Allocated amount",
      );
  }

  if (update.spent !== undefined) {
    cleanUpdate.spent =
      moneyValue(
        update.spent,
        "Spent amount",
      );
  }

  if (
    update.owner_name !==
    undefined
  ) {
    cleanUpdate.owner_name =
      update.owner_name.trim();
  }

  if (
    update.budget_status !==
    undefined
  ) {
    cleanUpdate.budget_status =
      update.budget_status;

    cleanUpdate.archived_at =
      update.budget_status ===
      "archived"
        ? new Date().toISOString()
        : null;
  }

  if (update.notes !== undefined) {
    cleanUpdate.notes =
      update.notes.trim();
  }

  const { data, error } =
    await supabase
      .from(
        "circle_budget_items",
      )
      .update(cleanUpdate)
      .eq(
        "id",
        requiredId(
          id,
          "Budget item",
        ),
      )
      .select("*")
      .single();

  if (error) {
    throw friendlyDatabaseError(
      error,
      "The budget item could not be updated.",
    );
  }

  return data as unknown as SecureCircleBudgetItem;
}