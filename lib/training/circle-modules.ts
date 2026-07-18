export type CircleTrainingAudience =
  | "worker"
  | "provider"
  | "support-coordinator"
  | "therapist"
  | "family-member"
  | "other-circle-member";

export type CircleTrainingModuleStatus =
  | "draft"
  | "active"
  | "retired";

export type CircleTrainingRequirementStatus =
  | "required"
  | "in-progress"
  | "submitted"
  | "changes-requested"
  | "completed"
  | "waived"
  | "expired"
  | "removed";

export type CircleTrainingContentBlockType =
  | "text"
  | "heading"
  | "list"
  | "participant-message"
  | "communication"
  | "routine"
  | "preference"
  | "safety"
  | "boundary"
  | "scenario"
  | "acknowledgement";

export type CircleTrainingContentBlock = {
  id: string;
  type: CircleTrainingContentBlockType;
  title: string;
  content: string;
  items: string[];
  required: boolean;
  order: number;
};

export type CircleTrainingQuestionType =
  | "acknowledgement"
  | "multiple-choice"
  | "short-answer"
  | "scenario"
  | "reflection";

export type CircleTrainingQuestionOption = {
  id: string;
  label: string;
};

export type CircleTrainingQuestion = {
  id: string;
  type: CircleTrainingQuestionType;
  prompt: string;
  options: CircleTrainingQuestionOption[];
  correctOptionIds: string[];
  requiredElements: string[];
  criticalFailureIndicators: string[];
  minimumResponseLength: number;
  critical: boolean;
  order: number;
};

export type ParticipantSpecificTrainingModule = {
  id: string;
  circleId: string;
  participantId: string;
  participantDisplayName: string;

  title: string;
  version: string;
  status: CircleTrainingModuleStatus;

  purpose: string;
  participantIntroduction: string;

  requiredForAllCircleMembers: boolean;
  requiredAudiences: CircleTrainingAudience[];

  contentBlocks: CircleTrainingContentBlock[];
  questions: CircleTrainingQuestion[];

  minimumKnowledgeScore: number;
  criticalQuestionsMustPass: boolean;
  participantApprovalRequired: boolean;
  humanReviewRequired: boolean;
  renewalMonths: number | null;

  createdByParticipantId: string;
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
  retiredAt: string | null;
};

export type CircleTrainingRequirement = {
  id: string;
  circleId: string;
  participantId: string;
  moduleId: string;
  moduleVersion: string;

  memberId: string;
  memberDisplayName: string;
  memberEmail: string;
  audience: CircleTrainingAudience;

  status: CircleTrainingRequirementStatus;

  assignedAt: string;
  startedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;

  learnerAcknowledgementAcceptedAt: string | null;
  assessmentResponses: CircleTrainingAssessmentResponse[];
  knowledgeScore: number | null;
  criticalQuestionsPassed: boolean;

  participantDecision:
    | "pending"
    | "approved"
    | "changes-requested";
  participantDecisionNote: string;
  participantDecisionAt: string | null;

  reviewerDecision:
    | "not-required"
    | "pending"
    | "satisfactory"
    | "changes-requested";
  reviewerDecisionNote: string;
  reviewerDecisionAt: string | null;

  lastUpdatedAt: string;
};

export type CircleTrainingAssessmentResponse = {
  questionId: string;
  response: string;
  selectedOptionIds: string[];
  startedAt: string;
  answeredAt: string;
};

export type CreateParticipantSpecificModuleInput = {
  circleId: string;
  participantId: string;
  participantDisplayName: string;

  title?: string;
  purpose: string;
  participantIntroduction: string;

  requiredAudiences?: CircleTrainingAudience[];

  communicationInformation: string;
  importantRoutines: string;
  preferencesAndChoices: string;
  safetyAndSupportInformation: string;
  boundariesAndExpectations: string;

  additionalContentBlocks?: CircleTrainingContentBlock[];
  additionalQuestions?: CircleTrainingQuestion[];

  participantApprovalRequired?: boolean;
  humanReviewRequired?: boolean;
  renewalMonths?: number | null;
};

export type AssignCircleTrainingInput = {
  moduleId: string;
  memberId: string;
  memberDisplayName: string;
  memberEmail: string;
  audience: CircleTrainingAudience;
};

const CIRCLE_TRAINING_MODULES_STORAGE_KEY =
  "smiling-monad-circle-training-modules-v1";

const CIRCLE_TRAINING_REQUIREMENTS_STORAGE_KEY =
  "smiling-monad-circle-training-requirements-v1";

const CIRCLE_TRAINING_UPDATED_EVENT =
  "smiling-monad-circle-training-updated";

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

function ensureBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error(
      "Circle training records can only be changed in the browser prototype.",
    );
  }
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertText(
  value: string,
  label: string,
): string {
  const cleaned = value.trim();

  if (!cleaned) {
    throw new Error(`${label} is required.`);
  }

  return cleaned;
}

function readList<T>(
  storageKey: string,
): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored =
    window.localStorage.getItem(storageKey);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? (parsed as T[])
      : [];
  } catch {
    return [];
  }
}

function saveList<T>(
  storageKey: string,
  values: T[],
): void {
  ensureBrowser();

  window.localStorage.setItem(
    storageKey,
    JSON.stringify(values),
  );

  window.dispatchEvent(
    new CustomEvent(
      CIRCLE_TRAINING_UPDATED_EVENT,
    ),
  );
}

function defaultRequiredAudiences():
  CircleTrainingAudience[] {
  return [
    "worker",
    "provider",
    "support-coordinator",
    "therapist",
    "family-member",
    "other-circle-member",
  ];
}

function createDefaultQuestions():
  CircleTrainingQuestion[] {
  return [
    {
      id: createId("circle-question"),
      type: "acknowledgement",
      prompt:
        "I confirm that I have read the participant’s communication, routines, preferences, safety information and Circle expectations.",
      options: [
        {
          id: "accepted",
          label: "I confirm",
        },
      ],
      correctOptionIds: ["accepted"],
      requiredElements: [],
      criticalFailureIndicators: [],
      minimumResponseLength: 0,
      critical: true,
      order: 1,
    },
    {
      id: createId("circle-question"),
      type: "short-answer",
      prompt:
        "In your own words, explain how this participant communicates and how you will check that you have understood them.",
      options: [],
      correctOptionIds: [],
      requiredElements: [
        "Recognise the participant’s communication methods",
        "Check understanding respectfully",
        "Avoid assumptions",
      ],
      criticalFailureIndicators: [
        "Ignore the participant's communication",
        "Only accept spoken communication",
      ],
      minimumResponseLength: 80,
      critical: true,
      order: 2,
    },
    {
      id: createId("circle-question"),
      type: "scenario",
      prompt:
        "Describe what you would do if the participant’s preference was different from the usual routine or another person’s request.",
      options: [],
      correctOptionIds: [],
      requiredElements: [
        "Keep the participant at the centre",
        "Respect choice and consent",
        "Clarify genuine safety concerns",
        "Escalate unresolved conflict appropriately",
      ],
      criticalFailureIndicators: [
        "Automatically override the participant",
        "Use pressure or punishment",
      ],
      minimumResponseLength: 120,
      critical: true,
      order: 3,
    },
    {
      id: createId("circle-question"),
      type: "reflection",
      prompt:
        "What will you personally do to help this participant feel understood, safe and in control within their Circle of Support?",
      options: [],
      correctOptionIds: [],
      requiredElements: [
        "Specific actions",
        "Respect for participant control",
        "Awareness of individual preferences",
      ],
      criticalFailureIndicators: [],
      minimumResponseLength: 100,
      critical: false,
      order: 4,
    },
  ];
}

function createDefaultContentBlocks(
  input: CreateParticipantSpecificModuleInput,
): CircleTrainingContentBlock[] {
  return [
    {
      id: createId("circle-content"),
      type: "participant-message",
      title: "A message from the participant",
      content:
        assertText(
          input.participantIntroduction,
          "Participant introduction",
        ),
      items: [],
      required: true,
      order: 1,
    },
    {
      id: createId("circle-content"),
      type: "communication",
      title: "How I communicate",
      content:
        assertText(
          input.communicationInformation,
          "Communication information",
        ),
      items: [],
      required: true,
      order: 2,
    },
    {
      id: createId("circle-content"),
      type: "routine",
      title: "My important routines",
      content:
        assertText(
          input.importantRoutines,
          "Important routines",
        ),
      items: [],
      required: true,
      order: 3,
    },
    {
      id: createId("circle-content"),
      type: "preference",
      title: "My preferences and choices",
      content:
        assertText(
          input.preferencesAndChoices,
          "Preferences and choices",
        ),
      items: [],
      required: true,
      order: 4,
    },
    {
      id: createId("circle-content"),
      type: "safety",
      title: "What helps me feel safe and supported",
      content:
        assertText(
          input.safetyAndSupportInformation,
          "Safety and support information",
        ),
      items: [],
      required: true,
      order: 5,
    },
    {
      id: createId("circle-content"),
      type: "boundary",
      title: "My Circle expectations and boundaries",
      content:
        assertText(
          input.boundariesAndExpectations,
          "Boundaries and expectations",
        ),
      items: [],
      required: true,
      order: 6,
    },
  ];
}

export function readParticipantSpecificModules():
  ParticipantSpecificTrainingModule[] {
  return readList<ParticipantSpecificTrainingModule>(
    CIRCLE_TRAINING_MODULES_STORAGE_KEY,
  );
}

export function readCircleTrainingRequirements():
  CircleTrainingRequirement[] {
  return readList<CircleTrainingRequirement>(
    CIRCLE_TRAINING_REQUIREMENTS_STORAGE_KEY,
  );
}

export function getParticipantSpecificModule(
  moduleId: string,
): ParticipantSpecificTrainingModule | null {
  return (
    readParticipantSpecificModules().find(
      (module) => module.id === moduleId,
    ) ?? null
  );
}

export function getActiveCircleModule(
  circleId: string,
): ParticipantSpecificTrainingModule | null {
  return (
    readParticipantSpecificModules()
      .filter(
        (module) =>
          module.circleId === circleId &&
          module.status === "active",
      )
      .sort(
        (left, right) =>
          Date.parse(right.updatedAt) -
          Date.parse(left.updatedAt),
      )[0] ?? null
  );
}

export function createParticipantSpecificModule(
  input: CreateParticipantSpecificModuleInput,
): ParticipantSpecificTrainingModule {
  ensureBrowser();

  const modules =
    readParticipantSpecificModules();

  const existingActive =
    modules.find(
      (module) =>
        module.circleId ===
          input.circleId &&
        module.status === "active",
    );

  if (existingActive) {
    throw new Error(
      "This Circle already has an active participant-specific mandatory module. Retire or update it before creating another.",
    );
  }

  const createdAt = now();

  const module: ParticipantSpecificTrainingModule =
    {
      id: createId(
        "participant-module",
      ),
      circleId: assertText(
        input.circleId,
        "Circle",
      ),
      participantId: assertText(
        input.participantId,
        "Participant",
      ),
      participantDisplayName:
        assertText(
          input.participantDisplayName,
          "Participant name",
        ),

      title:
        input.title?.trim() ||
        `Working With ${input.participantDisplayName.trim()}`,
      version: "1.0.0",
      status: "draft",

      purpose: assertText(
        input.purpose,
        "Module purpose",
      ),
      participantIntroduction:
        assertText(
          input.participantIntroduction,
          "Participant introduction",
        ),

      requiredForAllCircleMembers: true,
      requiredAudiences:
        input.requiredAudiences?.length
          ? [
              ...new Set(
                input.requiredAudiences,
              ),
            ]
          : defaultRequiredAudiences(),

      contentBlocks: [
        ...createDefaultContentBlocks(
          input,
        ),
        ...(input.additionalContentBlocks ??
          []),
      ].sort(
        (left, right) =>
          left.order - right.order,
      ),

      questions: [
        ...createDefaultQuestions(),
        ...(input.additionalQuestions ??
          []),
      ].sort(
        (left, right) =>
          left.order - right.order,
      ),

      minimumKnowledgeScore: 80,
      criticalQuestionsMustPass: true,
      participantApprovalRequired:
        input.participantApprovalRequired ??
        true,
      humanReviewRequired:
        input.humanReviewRequired ?? false,
      renewalMonths:
        input.renewalMonths ?? 12,

      createdByParticipantId:
        input.participantId,
      createdAt,
      updatedAt: createdAt,
      activatedAt: null,
      retiredAt: null,
    };

  modules.push(module);

  saveList(
    CIRCLE_TRAINING_MODULES_STORAGE_KEY,
    modules,
  );

  return module;
}

export function activateParticipantSpecificModule(
  moduleId: string,
): ParticipantSpecificTrainingModule {
  const modules =
    readParticipantSpecificModules();

  const index = modules.findIndex(
    (module) => module.id === moduleId,
  );

  if (index < 0) {
    throw new Error(
      "Participant-specific module not found.",
    );
  }

  const target = modules[index];

  const hasAllRequiredContent =
    target.contentBlocks
      .filter((block) => block.required)
      .every(
        (block) =>
          block.content.trim().length > 0,
      );

  if (!hasAllRequiredContent) {
    throw new Error(
      "All required participant-specific learning content must be completed before activation.",
    );
  }

  const activatedAt = now();

  const updated =
    modules.map((module) => {
      if (
        module.circleId !== target.circleId
      ) {
        return module;
      }

      if (module.id === moduleId) {
        return {
          ...module,
          status: "active" as const,
          activatedAt,
          updatedAt: activatedAt,
          retiredAt: null,
        };
      }

      if (module.status === "active") {
        return {
          ...module,
          status: "retired" as const,
          retiredAt: activatedAt,
          updatedAt: activatedAt,
        };
      }

      return module;
    });

  saveList(
    CIRCLE_TRAINING_MODULES_STORAGE_KEY,
    updated,
  );

  return (
    updated.find(
      (module) => module.id === moduleId,
    ) as ParticipantSpecificTrainingModule
  );
}

export function assignMandatoryCircleTraining(
  input: AssignCircleTrainingInput,
): CircleTrainingRequirement {
  ensureBrowser();

  const module =
    getParticipantSpecificModule(
      input.moduleId,
    );

  if (!module) {
    throw new Error(
      "Participant-specific module not found.",
    );
  }

  if (module.status !== "active") {
    throw new Error(
      "Only an active participant-specific module can be assigned.",
    );
  }

  if (
    !module.requiredAudiences.includes(
      input.audience,
    )
  ) {
    throw new Error(
      "This Circle member type is not included in the module’s required audiences.",
    );
  }

  const requirements =
    readCircleTrainingRequirements();

  const duplicate =
    requirements.find(
      (requirement) =>
        requirement.moduleId ===
          module.id &&
        requirement.memberId ===
          input.memberId &&
        ![
          "removed",
          "expired",
        ].includes(requirement.status),
    );

  if (duplicate) {
    return duplicate;
  }

  const assignedAt = now();

  const requirement: CircleTrainingRequirement =
    {
      id: createId(
        "circle-training-requirement",
      ),
      circleId: module.circleId,
      participantId:
        module.participantId,
      moduleId: module.id,
      moduleVersion: module.version,

      memberId: assertText(
        input.memberId,
        "Circle member",
      ),
      memberDisplayName:
        assertText(
          input.memberDisplayName,
          "Circle member name",
        ),
      memberEmail:
        normaliseEmail(
          assertText(
            input.memberEmail,
            "Circle member email",
          ),
        ),
      audience: input.audience,

      status: "required",

      assignedAt,
      startedAt: null,
      submittedAt: null,
      completedAt: null,
      expiresAt: null,

      learnerAcknowledgementAcceptedAt:
        null,
      assessmentResponses: [],
      knowledgeScore: null,
      criticalQuestionsPassed: false,

      participantDecision: "pending",
      participantDecisionNote: "",
      participantDecisionAt: null,

      reviewerDecision:
        module.humanReviewRequired
          ? "pending"
          : "not-required",
      reviewerDecisionNote: "",
      reviewerDecisionAt: null,

      lastUpdatedAt: assignedAt,
    };

  requirements.push(requirement);

  saveList(
    CIRCLE_TRAINING_REQUIREMENTS_STORAGE_KEY,
    requirements,
  );

  return requirement;
}

export function assignActiveModuleToCircleMembers(
  circleId: string,
  members: Array<{
    memberId: string;
    memberDisplayName: string;
    memberEmail: string;
    audience: CircleTrainingAudience;
  }>,
): CircleTrainingRequirement[] {
  const module =
    getActiveCircleModule(circleId);

  if (!module) {
    throw new Error(
      "No active participant-specific mandatory module exists for this Circle.",
    );
  }

  return members
    .filter((member) =>
      module.requiredAudiences.includes(
        member.audience,
      ),
    )
    .map((member) =>
      assignMandatoryCircleTraining({
        moduleId: module.id,
        ...member,
      }),
    );
}

export function canMemberJoinCircle(
  circleId: string,
  memberId: string,
): boolean {
  const activeModule =
    getActiveCircleModule(circleId);

  if (!activeModule) {
    return true;
  }

  const requirement =
    readCircleTrainingRequirements().find(
      (item) =>
        item.circleId === circleId &&
        item.moduleId ===
          activeModule.id &&
        item.memberId === memberId,
    );

  return (
    requirement?.status === "completed"
  );
}

export function getMemberCircleAccessReason(
  circleId: string,
  memberId: string,
): string {
  const activeModule =
    getActiveCircleModule(circleId);

  if (!activeModule) {
    return "No participant-specific training module is currently required.";
  }

  const requirement =
    readCircleTrainingRequirements().find(
      (item) =>
        item.circleId === circleId &&
        item.moduleId ===
          activeModule.id &&
        item.memberId === memberId,
    );

  if (!requirement) {
    return "The mandatory participant-specific training module has not yet been assigned.";
  }

  if (
    requirement.status !== "completed"
  ) {
    return `Complete “${activeModule.title}” before joining this Circle.`;
  }

  return "Participant-specific mandatory training is complete.";
}

export function subscribeToCircleTraining(
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
    CIRCLE_TRAINING_UPDATED_EVENT,
    handler,
  );

  return () => {
    window.removeEventListener(
      "storage",
      handler,
    );

    window.removeEventListener(
      CIRCLE_TRAINING_UPDATED_EVENT,
      handler,
    );
  };
}