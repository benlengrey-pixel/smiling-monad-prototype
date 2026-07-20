import type {
  SupabaseClient,
  User,
} from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type SecureCircleGoalStatus =
  | "planning"
  | "active"
  | "paused"
  | "achieved"
  | "archived";

export type SecureCircleGoalPriority =
  | "low"
  | "medium"
  | "high";

export type SecureCircleGoalCategory =
  | "daily_living"
  | "health"
  | "communication"
  | "relationships"
  | "community"
  | "education"
  | "employment"
  | "independence"
  | "wellbeing"
  | "other";

export type SecureCircleGoal = {
  id: string;
  circle_id: string;
  participant_id: string;
  title: string;
  description: string;
  desired_outcome: string;
  category: SecureCircleGoalCategory;
  goal_status: SecureCircleGoalStatus;
  priority: SecureCircleGoalPriority;
  owner_name: string;
  target_date: string | null;
  progress_notes: string;
  achieved_at: string | null;
  archived_at: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateSecureCircleGoalInput = {
  circleId: string;
  participantId: string;
  title: string;
  description?: string;
  desiredOutcome?: string;
  category?: SecureCircleGoalCategory;
  priority?: SecureCircleGoalPriority;
  ownerName?: string;
  targetDate?: string | null;
};

export type UpdateSecureCircleGoalInput = {
  title?: string;
  description?: string;
  desiredOutcome?: string;
  category?: SecureCircleGoalCategory;
  status?: SecureCircleGoalStatus;
  priority?: SecureCircleGoalPriority;
  ownerName?: string;
  targetDate?: string | null;
  progressNotes?: string;
};

function getClient(): SupabaseClient {
  return getSupabaseBrowserClient();
}

function cleanRequiredText(
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
      "You must be signed in to manage Circle goals.",
    );
  }

  return user;
}

export async function readSecureCircleGoals(
  circleId: string,
): Promise<SecureCircleGoal[]> {
  const supabase = getClient();

  await requireAuthenticatedUser(
    supabase,
  );

  const { data, error } = await supabase
    .from("circle_goals")
    .select("*")
    .eq("circle_id", circleId)
    .neq("goal_status", "archived")
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as SecureCircleGoal[];
}

export async function createSecureCircleGoal(
  input: CreateSecureCircleGoalInput,
): Promise<SecureCircleGoal> {
  const supabase = getClient();

  const user =
    await requireAuthenticatedUser(
      supabase,
    );

  const title = cleanRequiredText(
    input.title,
    "Goal title",
  );

  const { data, error } = await supabase
    .from("circle_goals")
    .insert({
      circle_id: input.circleId,
      participant_id:
        input.participantId,
      title,
      description:
        input.description?.trim() ?? "",
      desired_outcome:
        input.desiredOutcome?.trim() ?? "",
      category:
        input.category ?? "other",
      goal_status: "planning",
      priority:
        input.priority ?? "medium",
      owner_name:
        input.ownerName?.trim() ?? "",
      target_date:
        input.targetDate || null,
      progress_notes: "",
      created_by: user.id,
      updated_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "The Circle goal could not be created.",
    );
  }

  return data as unknown as SecureCircleGoal;
}

export async function updateSecureCircleGoal(
  goalId: string,
  input: UpdateSecureCircleGoalInput,
): Promise<SecureCircleGoal> {
  const supabase = getClient();

  const user =
    await requireAuthenticatedUser(
      supabase,
    );

  const update: Record<string, unknown> = {
    updated_by: user.id,
  };

  if (input.title !== undefined) {
    update.title = cleanRequiredText(
      input.title,
      "Goal title",
    );
  }

  if (input.description !== undefined) {
    update.description =
      input.description.trim();
  }

  if (input.desiredOutcome !== undefined) {
    update.desired_outcome =
      input.desiredOutcome.trim();
  }

  if (input.category !== undefined) {
    update.category = input.category;
  }

  if (input.status !== undefined) {
    update.goal_status = input.status;
  }

  if (input.priority !== undefined) {
    update.priority = input.priority;
  }

  if (input.ownerName !== undefined) {
    update.owner_name =
      input.ownerName.trim();
  }

  if (input.targetDate !== undefined) {
    update.target_date =
      input.targetDate || null;
  }

  if (input.progressNotes !== undefined) {
    update.progress_notes =
      input.progressNotes.trim();
  }

  const { data, error } = await supabase
    .from("circle_goals")
    .update(update)
    .eq("id", goalId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "The Circle goal could not be updated.",
    );
  }

  return data as unknown as SecureCircleGoal;
}

export async function archiveSecureCircleGoal(
  goalId: string,
): Promise<SecureCircleGoal> {
  return updateSecureCircleGoal(
    goalId,
    {
      status: "archived",
    },
  );
}

export async function advanceSecureCircleGoal(
  goal: SecureCircleGoal,
): Promise<SecureCircleGoal> {
  const statusOrder: SecureCircleGoalStatus[] = [
    "planning",
    "active",
    "achieved",
  ];

  const currentIndex =
    statusOrder.indexOf(
      goal.goal_status,
    );

  const nextStatus =
    currentIndex < 0 ||
    currentIndex ===
      statusOrder.length - 1
      ? "planning"
      : statusOrder[currentIndex + 1];

  return updateSecureCircleGoal(
    goal.id,
    {
      status: nextStatus,
    },
  );
}