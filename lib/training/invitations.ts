export type TrainingInvitationStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "declined"
  | "training-started"
  | "assessment-submitted"
  | "under-review"
  | "changes-requested"
  | "approved"
  | "expired"
  | "cancelled";

export type RequestedWorkerRole =
  | "support-worker"
  | "community-access-worker"
  | "personal-care-worker"
  | "domestic-support-worker"
  | "transport-support-worker"
  | "mentor"
  | "respite-worker"
  | "other";

export type ParticipantVisibleTrainingStage =
  | "invitation-sent"
  | "invitation-accepted"
  | "training-started"
  | "learning-complete"
  | "assessment-submitted"
  | "evidence-under-review"
  | "changes-requested"
  | "approved"
  | "not-completed";

export type TrainingInvitationPermission =
  | "view-training-outline"
  | "view-progress-summary"
  | "view-approval-status"
  | "invite-to-circle-after-approval";

export type ParticipantTrainingInvitation = {
  id: string;

  circleId: string;
  participantId: string;
  participantDisplayName: string;

  workerId: string | null;
  workerEmail: string;
  workerDisplayName: string;

  requestedRole: RequestedWorkerRole;
  customRoleTitle: string;
  roleDescription: string;

  trainingProgramId: string;
  trainingProgramVersion: string;
  requiredModuleIds: string[];

  participantMessage: string;
  participantReason: string;

  status: TrainingInvitationStatus;
  visibleStage: ParticipantVisibleTrainingStage;

  permissions: TrainingInvitationPermission[];

  createdAt: string;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  expiredAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;

  linkedWorkerApplicationId: string | null;
  linkedTrainingRecordId: string | null;

  lastUpdatedAt: string;
};

export type ParticipantTrainingInvitationSummary = {
  id: string;
  workerDisplayName: string;
  requestedRoleLabel: string;
  status: TrainingInvitationStatus;
  visibleStage: ParticipantVisibleTrainingStage;
  progressLabel: string;
  participantCanViewTrainingOutline: boolean;
  participantCanViewProgressSummary: boolean;
  participantCanViewApprovalStatus: boolean;
  updatedAt: string;
};

export type CreateTrainingInvitationInput = {
  circleId: string;
  participantId: string;
  participantDisplayName: string;

  workerId?: string | null;
  workerEmail: string;
  workerDisplayName: string;

  requestedRole: RequestedWorkerRole;
  customRoleTitle?: string;
  roleDescription: string;

  trainingProgramId: string;
  trainingProgramVersion: string;
  requiredModuleIds: string[];

  participantMessage?: string;
  participantReason: string;

  expiresInDays?: number;
};

export type AcceptTrainingInvitationInput = {
  invitationId: string;
  workerId: string;
  workerApplicationId: string;
  trainingRecordId?: string | null;
};

const TRAINING_INVITATION_STORAGE_KEY =
  "smiling-monad-training-invitations-v1";

const TRAINING_INVITATION_UPDATED_EVENT =
  "smiling-monad-training-invitations-updated";

function now(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  return `${prefix}-${random}`;
}

function addDays(
  isoDate: string,
  days: number,
): string {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function ensureBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error(
      "Training invitations can only be changed in the browser prototype.",
    );
  }
}

function readStoredInvitations():
  ParticipantTrainingInvitation[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = window.localStorage.getItem(
    TRAINING_INVITATION_STORAGE_KEY,
  );

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? (parsed as ParticipantTrainingInvitation[])
      : [];
  } catch {
    return [];
  }
}

function saveStoredInvitations(
  invitations: ParticipantTrainingInvitation[],
): void {
  ensureBrowser();

  window.localStorage.setItem(
    TRAINING_INVITATION_STORAGE_KEY,
    JSON.stringify(invitations),
  );

  window.dispatchEvent(
    new CustomEvent(
      TRAINING_INVITATION_UPDATED_EVENT,
    ),
  );
}

function updateInvitation(
  invitationId: string,
  updater: (
    invitation: ParticipantTrainingInvitation,
  ) => ParticipantTrainingInvitation,
): ParticipantTrainingInvitation {
  const invitations = readStoredInvitations();
  const index = invitations.findIndex(
    (invitation) =>
      invitation.id === invitationId,
  );

  if (index < 0) {
    throw new Error(
      "Training invitation not found.",
    );
  }

  const updated = updater(
    invitations[index],
  );

  invitations[index] = {
    ...updated,
    lastUpdatedAt: now(),
  };

  saveStoredInvitations(invitations);

  return invitations[index];
}

function assertRequiredText(
  value: string,
  label: string,
): string {
  const cleaned = value.trim();

  if (!cleaned) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return cleaned;
}

function assertValidEmail(
  email: string,
): string {
  const cleaned =
    normaliseEmail(email);

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      cleaned,
    )
  ) {
    throw new Error(
      "A valid worker email address is required.",
    );
  }

  return cleaned;
}

function roleLabel(
  invitation: ParticipantTrainingInvitation,
): string {
  if (
    invitation.requestedRole === "other"
  ) {
    return (
      invitation.customRoleTitle.trim() ||
      "Custom support role"
    );
  }

  return invitation.requestedRole
    .split("-")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function progressLabel(
  stage: ParticipantVisibleTrainingStage,
): string {
  switch (stage) {
    case "invitation-sent":
      return "Invitation sent";
    case "invitation-accepted":
      return "Invitation accepted";
    case "training-started":
      return "Training started";
    case "learning-complete":
      return "Learning complete";
    case "assessment-submitted":
      return "Assessment submitted";
    case "evidence-under-review":
      return "Evidence under review";
    case "changes-requested":
      return "Further learning requested";
    case "approved":
      return "Approved";
    case "not-completed":
      return "Not completed";
    default:
      return stage;
  }
}

export function readTrainingInvitations():
  ParticipantTrainingInvitation[] {
  return readStoredInvitations();
}

export function getTrainingInvitation(
  invitationId: string,
): ParticipantTrainingInvitation | null {
  return (
    readStoredInvitations().find(
      (invitation) =>
        invitation.id === invitationId,
    ) ?? null
  );
}

export function getCircleTrainingInvitations(
  circleId: string,
): ParticipantTrainingInvitation[] {
  return readStoredInvitations()
    .filter(
      (invitation) =>
        invitation.circleId === circleId,
    )
    .sort(
      (left, right) =>
        Date.parse(right.lastUpdatedAt) -
        Date.parse(left.lastUpdatedAt),
    );
}

export function getWorkerTrainingInvitations(
  workerEmail: string,
): ParticipantTrainingInvitation[] {
  const normalised =
    normaliseEmail(workerEmail);

  return readStoredInvitations()
    .filter(
      (invitation) =>
        invitation.workerEmail ===
        normalised,
    )
    .sort(
      (left, right) =>
        Date.parse(right.lastUpdatedAt) -
        Date.parse(left.lastUpdatedAt),
    );
}

export function createTrainingInvitation(
  input: CreateTrainingInvitationInput,
): ParticipantTrainingInvitation {
  ensureBrowser();

  const createdAt = now();
  const expiresInDays = Math.max(
    1,
    Math.min(
      input.expiresInDays ?? 30,
      90,
    ),
  );

  const invitation: ParticipantTrainingInvitation =
    {
      id: createId(
        "training-invitation",
      ),

      circleId: assertRequiredText(
        input.circleId,
        "Circle",
      ),
      participantId: assertRequiredText(
        input.participantId,
        "Participant",
      ),
      participantDisplayName:
        assertRequiredText(
          input.participantDisplayName,
          "Participant name",
        ),

      workerId:
        input.workerId?.trim() || null,
      workerEmail: assertValidEmail(
        input.workerEmail,
      ),
      workerDisplayName:
        assertRequiredText(
          input.workerDisplayName,
          "Worker name",
        ),

      requestedRole:
        input.requestedRole,
      customRoleTitle:
        input.customRoleTitle?.trim() ?? "",
      roleDescription:
        assertRequiredText(
          input.roleDescription,
          "Role description",
        ),

      trainingProgramId:
        assertRequiredText(
          input.trainingProgramId,
          "Training program",
        ),
      trainingProgramVersion:
        assertRequiredText(
          input.trainingProgramVersion,
          "Training program version",
        ),
      requiredModuleIds: [
        ...new Set(
          input.requiredModuleIds
            .map((moduleId) =>
              moduleId.trim(),
            )
            .filter(Boolean),
        ),
      ],

      participantMessage:
        input.participantMessage?.trim() ??
        "",
      participantReason:
        assertRequiredText(
          input.participantReason,
          "Participant reason",
        ),

      status: "draft",
      visibleStage: "invitation-sent",

      permissions: [
        "view-training-outline",
        "view-progress-summary",
        "view-approval-status",
        "invite-to-circle-after-approval",
      ],

      createdAt,
      sentAt: null,
      viewedAt: null,
      respondedAt: null,
      acceptedAt: null,
      declinedAt: null,
      expiredAt: addDays(
        createdAt,
        expiresInDays,
      ),
      cancelledAt: null,
      completedAt: null,

      linkedWorkerApplicationId: null,
      linkedTrainingRecordId: null,

      lastUpdatedAt: createdAt,
    };

  if (
    invitation.requiredModuleIds.length === 0
  ) {
    throw new Error(
      "At least one training module is required.",
    );
  }

  if (
    invitation.requestedRole === "other" &&
    !invitation.customRoleTitle
  ) {
    throw new Error(
      "A custom role title is required.",
    );
  }

  const invitations =
    readStoredInvitations();

  const duplicate =
    invitations.some(
      (existing) =>
        existing.circleId ===
          invitation.circleId &&
        existing.workerEmail ===
          invitation.workerEmail &&
        ![
          "declined",
          "expired",
          "cancelled",
          "approved",
        ].includes(existing.status),
    );

  if (duplicate) {
    throw new Error(
      "An active training invitation already exists for this worker in this Circle.",
    );
  }

  invitations.push(invitation);
  saveStoredInvitations(invitations);

  return invitation;
}

export function sendTrainingInvitation(
  invitationId: string,
): ParticipantTrainingInvitation {
  return updateInvitation(
    invitationId,
    (invitation) => {
      if (
        invitation.status !== "draft"
      ) {
        throw new Error(
          "Only a draft invitation can be sent.",
        );
      }

      return {
        ...invitation,
        status: "sent",
        visibleStage:
          "invitation-sent",
        sentAt: now(),
      };
    },
  );
}

export function markTrainingInvitationViewed(
  invitationId: string,
): ParticipantTrainingInvitation {
  return updateInvitation(
    invitationId,
    (invitation) => {
      if (
        ![
          "sent",
          "viewed",
        ].includes(invitation.status)
      ) {
        return invitation;
      }

      return {
        ...invitation,
        status: "viewed",
        viewedAt:
          invitation.viewedAt ?? now(),
      };
    },
  );
}

export function acceptTrainingInvitation(
  input: AcceptTrainingInvitationInput,
): ParticipantTrainingInvitation {
  return updateInvitation(
    input.invitationId,
    (invitation) => {
      if (
        ![
          "sent",
          "viewed",
        ].includes(invitation.status)
      ) {
        throw new Error(
          "This training invitation cannot currently be accepted.",
        );
      }

      const acceptedAt = now();

      return {
        ...invitation,
        workerId:
          assertRequiredText(
            input.workerId,
            "Worker",
          ),
        linkedWorkerApplicationId:
          assertRequiredText(
            input.workerApplicationId,
            "Worker application",
          ),
        linkedTrainingRecordId:
          input.trainingRecordId?.trim() ||
          null,
        status: "accepted",
        visibleStage:
          "invitation-accepted",
        respondedAt: acceptedAt,
        acceptedAt,
      };
    },
  );
}

export function declineTrainingInvitation(
  invitationId: string,
): ParticipantTrainingInvitation {
  return updateInvitation(
    invitationId,
    (invitation) => {
      if (
        ![
          "sent",
          "viewed",
        ].includes(invitation.status)
      ) {
        throw new Error(
          "This training invitation cannot currently be declined.",
        );
      }

      const declinedAt = now();

      return {
        ...invitation,
        status: "declined",
        visibleStage:
          "not-completed",
        respondedAt: declinedAt,
        declinedAt,
      };
    },
  );
}

export function cancelTrainingInvitation(
  invitationId: string,
): ParticipantTrainingInvitation {
  return updateInvitation(
    invitationId,
    (invitation) => {
      if (
        [
          "approved",
          "expired",
          "cancelled",
        ].includes(invitation.status)
      ) {
        throw new Error(
          "This training invitation can no longer be cancelled.",
        );
      }

      return {
        ...invitation,
        status: "cancelled",
        visibleStage:
          "not-completed",
        cancelledAt: now(),
      };
    },
  );
}

export function linkTrainingRecordToInvitation(
  invitationId: string,
  trainingRecordId: string,
): ParticipantTrainingInvitation {
  return updateInvitation(
    invitationId,
    (invitation) => ({
      ...invitation,
      linkedTrainingRecordId:
        assertRequiredText(
          trainingRecordId,
          "Training record",
        ),
      status: "training-started",
      visibleStage:
        "training-started",
    }),
  );
}

export function updateTrainingInvitationProgress(
  invitationId: string,
  stage: ParticipantVisibleTrainingStage,
): ParticipantTrainingInvitation {
  return updateInvitation(
    invitationId,
    (invitation) => {
      const statusByStage: Record<
        ParticipantVisibleTrainingStage,
        TrainingInvitationStatus
      > = {
        "invitation-sent":
          invitation.status === "draft"
            ? "draft"
            : "sent",
        "invitation-accepted":
          "accepted",
        "training-started":
          "training-started",
        "learning-complete":
          "training-started",
        "assessment-submitted":
          "assessment-submitted",
        "evidence-under-review":
          "under-review",
        "changes-requested":
          "changes-requested",
        approved: "approved",
        "not-completed":
          invitation.status === "declined"
            ? "declined"
            : "cancelled",
      };

      return {
        ...invitation,
        status: statusByStage[stage],
        visibleStage: stage,
        completedAt:
          stage === "approved"
            ? now()
            : invitation.completedAt,
      };
    },
  );
}

export function getParticipantTrainingInvitationSummary(
  invitation:
    ParticipantTrainingInvitation,
): ParticipantTrainingInvitationSummary {
  return {
    id: invitation.id,
    workerDisplayName:
      invitation.workerDisplayName,
    requestedRoleLabel:
      roleLabel(invitation),
    status: invitation.status,
    visibleStage:
      invitation.visibleStage,
    progressLabel:
      progressLabel(
        invitation.visibleStage,
      ),
    participantCanViewTrainingOutline:
      invitation.permissions.includes(
        "view-training-outline",
      ),
    participantCanViewProgressSummary:
      invitation.permissions.includes(
        "view-progress-summary",
      ),
    participantCanViewApprovalStatus:
      invitation.permissions.includes(
        "view-approval-status",
      ),
    updatedAt:
      invitation.lastUpdatedAt,
  };
}

export function expireOldTrainingInvitations():
  ParticipantTrainingInvitation[] {
  ensureBrowser();

  const invitations =
    readStoredInvitations();
  const currentTime = Date.now();
  let changed = false;

  const updated =
    invitations.map((invitation) => {
      if (
        !invitation.expiredAt ||
        [
          "accepted",
          "training-started",
          "assessment-submitted",
          "under-review",
          "changes-requested",
          "approved",
          "declined",
          "cancelled",
          "expired",
        ].includes(invitation.status)
      ) {
        return invitation;
      }

      if (
        Date.parse(
          invitation.expiredAt,
        ) > currentTime
      ) {
        return invitation;
      }

      changed = true;

      return {
        ...invitation,
        status: "expired" as const,
        visibleStage:
          "not-completed" as const,
        lastUpdatedAt: now(),
      };
    });

  if (changed) {
    saveStoredInvitations(updated);
  }

  return updated;
}

export function subscribeToTrainingInvitations(
  listener: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => listener();

  window.addEventListener(
    "storage",
    handler,
  );
  window.addEventListener(
    TRAINING_INVITATION_UPDATED_EVENT,
    handler,
  );

  return () => {
    window.removeEventListener(
      "storage",
      handler,
    );
    window.removeEventListener(
      TRAINING_INVITATION_UPDATED_EVENT,
      handler,
    );
  };
}