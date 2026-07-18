import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";
import type {
  CircleTrainingRequirement,
  ParticipantSpecificTrainingModule,
} from "@/lib/training/circle-modules";

type JsonObject = Record<string, unknown>;

type CircleModuleRow = {
  id: string;
  circle_id: string;
  participant_user_id: string;
  module_key: string;
  version: number;
  title: string;
  status: "draft" | "active" | "retired";
  content: JsonObject;
  participant_approval_required: boolean;
  human_review_required: boolean;
  renewal_months: number | null;
  created_at: string;
  activated_at: string | null;
  updated_at: string;
};

type CircleRequirementRow = {
  id: string;
  circle_id: string;
  module_id: string;
  module_version: string;
  participant_user_id: string;
  learner_user_id: string;
  member_display_name: string;
  member_email: string;
  audience:
    | "worker"
    | "provider"
    | "support-coordinator"
    | "therapist"
    | "family-member"
    | "other-circle-member";
  status:
    | "required"
    | "in-progress"
    | "submitted"
    | "changes-requested"
    | "completed"
    | "waived"
    | "expired"
    | "removed";
  responses: unknown[];
  acknowledgement_accepted_at: string | null;
  knowledge_score: number | null;
  critical_questions_passed: boolean | null;
  participant_decision:
    | "pending"
    | "approved"
    | "changes-requested"
    | null;
  participant_decision_note: string;
  participant_decision_at: string | null;
  reviewer_user_id: string | null;
  reviewer_decision:
    | "pending"
    | "satisfactory"
    | "changes-requested"
    | null;
  reviewer_decision_note: string;
  reviewer_decision_at: string | null;
  assigned_at: string;
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  updated_at: string;
};

async function requireUserId(): Promise<string> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } =
    await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error(
      "You must be signed in before training data can be stored in Supabase.",
    );
  }

  return data.user.id;
}

function parseVersionNumber(
  version: string,
): number {
  const parsed = Number.parseInt(
    version.split(".")[0] ?? "1",
    10,
  );

  return Number.isFinite(parsed) &&
    parsed > 0
    ? parsed
    : 1;
}

function moduleToRow(
  module: ParticipantSpecificTrainingModule,
  participantUserId: string,
): Omit<
  CircleModuleRow,
  "created_at" | "updated_at"
> {
  return {
    id: module.id,
    circle_id: module.circleId,
    participant_user_id:
      participantUserId,
    module_key:
      "participant-specific",
    version: parseVersionNumber(
      module.version,
    ),
    title: module.title,
    status: module.status,
    content:
      module as unknown as JsonObject,
    participant_approval_required:
      module.participantApprovalRequired,
    human_review_required:
      module.humanReviewRequired,
    renewal_months:
      module.renewalMonths,
    activated_at:
      module.activatedAt,
  };
}

function rowToModule(
  row: CircleModuleRow,
): ParticipantSpecificTrainingModule {
  return row.content as unknown as ParticipantSpecificTrainingModule;
}

function requirementToRow(
  requirement: CircleTrainingRequirement,
  participantUserId: string,
  learnerUserId: string,
): Omit<
  CircleRequirementRow,
  "assigned_at" | "updated_at"
> {
  return {
    id: requirement.id,
    circle_id: requirement.circleId,
    module_id: requirement.moduleId,
    module_version:
      requirement.moduleVersion,
    participant_user_id:
      participantUserId,
    learner_user_id: learnerUserId,
    member_display_name:
      requirement.memberDisplayName,
    member_email:
      requirement.memberEmail
        .trim()
        .toLowerCase(),
    audience: requirement.audience,
    status: requirement.status,
    responses:
      requirement.assessmentResponses,
    acknowledgement_accepted_at:
      requirement.learnerAcknowledgementAcceptedAt,
    knowledge_score:
      requirement.knowledgeScore,
    critical_questions_passed:
      requirement.criticalQuestionsPassed,
    participant_decision:
      requirement.participantDecision,
    participant_decision_note:
      requirement.participantDecisionNote,
    participant_decision_at:
      requirement.participantDecisionAt,
    reviewer_user_id: null,
    reviewer_decision:
      requirement.reviewerDecision ===
      "not-required"
        ? null
        : requirement.reviewerDecision,
    reviewer_decision_note:
      requirement.reviewerDecisionNote,
    reviewer_decision_at:
      requirement.reviewerDecisionAt,
    started_at:
      requirement.startedAt,
    submitted_at:
      requirement.submittedAt,
    completed_at:
      requirement.completedAt,
    expires_at:
      requirement.expiresAt,
  };
}

function rowToRequirement(
  row: CircleRequirementRow,
): CircleTrainingRequirement {
  return {
    id: row.id,
    circleId: row.circle_id,
    participantId:
      row.participant_user_id,
    moduleId: row.module_id,
    moduleVersion:
      row.module_version,

    memberId: row.learner_user_id,
    memberDisplayName:
      row.member_display_name,
    memberEmail:
      row.member_email,
    audience: row.audience,

    status: row.status,

    assignedAt: row.assigned_at,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    completedAt: row.completed_at,
    expiresAt: row.expires_at,

    learnerAcknowledgementAcceptedAt:
      row.acknowledgement_accepted_at,
    assessmentResponses:
      row.responses as CircleTrainingRequirement["assessmentResponses"],
    knowledgeScore:
      row.knowledge_score,
    criticalQuestionsPassed:
      row.critical_questions_passed ??
      false,

    participantDecision:
      row.participant_decision ??
      "pending",
    participantDecisionNote:
      row.participant_decision_note,
    participantDecisionAt:
      row.participant_decision_at,

    reviewerDecision:
      row.reviewer_decision ??
      "not-required",
    reviewerDecisionNote:
      row.reviewer_decision_note,
    reviewerDecisionAt:
      row.reviewer_decision_at,

    lastUpdatedAt: row.updated_at,
  };
}

export async function readParticipantSpecificModulesFromDatabase(
  circleId: string,
): Promise<
  ParticipantSpecificTrainingModule[]
> {
  const supabase =
    getSupabaseBrowserClient();

  await requireUserId();

  const { data, error } =
    await supabase
      .from(
        "sm_circle_training_modules",
      )
      .select("*")
      .eq("circle_id", circleId)
      .order("version", {
        ascending: false,
      });

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data ?? []) as CircleModuleRow[]
  ).map(rowToModule);
}

export async function saveParticipantSpecificModuleToDatabase(
  module: ParticipantSpecificTrainingModule,
): Promise<
  ParticipantSpecificTrainingModule
> {
  const supabase =
    getSupabaseBrowserClient();

  const participantUserId =
    await requireUserId();

  const { data, error } =
    await supabase
      .from(
        "sm_circle_training_modules",
      )
      .upsert(
        moduleToRow(
          module,
          participantUserId,
        ),
        {
          onConflict: "id",
        },
      )
      .select("*")
      .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToModule(
    data as CircleModuleRow,
  );
}

export async function readCircleTrainingRequirementsFromDatabase(
  circleId: string,
): Promise<
  CircleTrainingRequirement[]
> {
  const supabase =
    getSupabaseBrowserClient();

  await requireUserId();

  const { data, error } =
    await supabase
      .from(
        "sm_circle_training_requirements",
      )
      .select("*")
      .eq("circle_id", circleId)
      .order("updated_at", {
        ascending: false,
      });

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data ?? []) as CircleRequirementRow[]
  ).map(rowToRequirement);
}

export async function saveCircleTrainingRequirementToDatabase(
  requirement: CircleTrainingRequirement,
  learnerUserId: string,
): Promise<
  CircleTrainingRequirement
> {
  const supabase =
    getSupabaseBrowserClient();

  const participantUserId =
    await requireUserId();

  const { data, error } =
    await supabase
      .from(
        "sm_circle_training_requirements",
      )
      .upsert(
        requirementToRow(
          requirement,
          participantUserId,
          learnerUserId,
        ),
        {
          onConflict: "id",
        },
      )
      .select("*")
      .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToRequirement(
    data as CircleRequirementRow,
  );
}

export async function updateMyCircleTrainingRequirementInDatabase(
  requirement: CircleTrainingRequirement,
): Promise<
  CircleTrainingRequirement
> {
  const supabase =
    getSupabaseBrowserClient();

  const learnerUserId =
    await requireUserId();

  const { data, error } =
    await supabase
      .from(
        "sm_circle_training_requirements",
      )
      .update({
        status: requirement.status,
        responses:
          requirement.assessmentResponses,
        acknowledgement_accepted_at:
          requirement.learnerAcknowledgementAcceptedAt,
        knowledge_score:
          requirement.knowledgeScore,
        critical_questions_passed:
          requirement.criticalQuestionsPassed,
        started_at:
          requirement.startedAt,
        submitted_at:
          requirement.submittedAt,
        completed_at:
          requirement.completedAt,
        expires_at:
          requirement.expiresAt,
      })
      .eq("id", requirement.id)
      .eq(
        "learner_user_id",
        learnerUserId,
      )
      .select("*")
      .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToRequirement(
    data as CircleRequirementRow,
  );
}

export async function migrateLocalCircleTrainingToDatabase(
  modules: ParticipantSpecificTrainingModule[],
  requirements: Array<{
    requirement: CircleTrainingRequirement;
    learnerUserId: string;
  }>,
): Promise<{
  modulesMigrated: number;
  requirementsMigrated: number;
}> {
  let modulesMigrated = 0;
  let requirementsMigrated = 0;

  for (const module of modules) {
    await saveParticipantSpecificModuleToDatabase(
      module,
    );
    modulesMigrated += 1;
  }

  for (const item of requirements) {
    await saveCircleTrainingRequirementToDatabase(
      item.requirement,
      item.learnerUserId,
    );
    requirementsMigrated += 1;
  }

  return {
    modulesMigrated,
    requirementsMigrated,
  };
}