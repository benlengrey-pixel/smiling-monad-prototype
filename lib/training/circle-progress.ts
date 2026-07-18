import {
  getParticipantSpecificModule,
  readCircleTrainingRequirements,
  type CircleTrainingAssessmentResponse,
  type CircleTrainingRequirement,
} from "./circle-modules";

const CIRCLE_TRAINING_REQUIREMENTS_STORAGE_KEY =
  "smiling-monad-circle-training-requirements-v1";

const CIRCLE_TRAINING_UPDATED_EVENT =
  "smiling-monad-circle-training-updated";

function now(): string {
  return new Date().toISOString();
}

function ensureBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error(
      "Circle training progress can only be changed in the browser prototype.",
    );
  }
}

function saveRequirements(
  requirements: CircleTrainingRequirement[],
): void {
  ensureBrowser();

  window.localStorage.setItem(
    CIRCLE_TRAINING_REQUIREMENTS_STORAGE_KEY,
    JSON.stringify(requirements),
  );

  window.dispatchEvent(
    new CustomEvent(
      CIRCLE_TRAINING_UPDATED_EVENT,
    ),
  );
}

function updateRequirement(
  requirementId: string,
  updater: (
    requirement: CircleTrainingRequirement,
  ) => CircleTrainingRequirement,
): CircleTrainingRequirement {
  const requirements =
    readCircleTrainingRequirements();

  const index = requirements.findIndex(
    (requirement) =>
      requirement.id === requirementId,
  );

  if (index < 0) {
    throw new Error(
      "Mandatory Circle training requirement not found.",
    );
  }

  const updated = {
    ...updater(requirements[index]),
    lastUpdatedAt: now(),
  };

  requirements[index] = updated;
  saveRequirements(requirements);

  return updated;
}

export function getCircleTrainingRequirement(
  requirementId: string,
): CircleTrainingRequirement | null {
  return (
    readCircleTrainingRequirements().find(
      (requirement) =>
        requirement.id === requirementId,
    ) ?? null
  );
}

export function getMemberCircleTrainingRequirement(
  circleId: string,
  memberId: string,
): CircleTrainingRequirement | null {
  return (
    readCircleTrainingRequirements()
      .filter(
        (requirement) =>
          requirement.circleId === circleId &&
          requirement.memberId === memberId &&
          ![
            "removed",
            "expired",
          ].includes(requirement.status),
      )
      .sort(
        (left, right) =>
          Date.parse(right.lastUpdatedAt) -
          Date.parse(left.lastUpdatedAt),
      )[0] ?? null
  );
}

export function startCircleTrainingRequirement(
  requirementId: string,
): CircleTrainingRequirement {
  return updateRequirement(
    requirementId,
    (requirement) => {
      if (
        requirement.status === "completed"
      ) {
        return requirement;
      }

      if (
        ![
          "required",
          "changes-requested",
          "in-progress",
        ].includes(requirement.status)
      ) {
        throw new Error(
          "This mandatory Circle module cannot currently be started.",
        );
      }

      return {
        ...requirement,
        status: "in-progress",
        startedAt:
          requirement.startedAt ?? now(),
      };
    },
  );
}

export function recordCircleTrainingResponse(
  requirementId: string,
  response: CircleTrainingAssessmentResponse,
): CircleTrainingRequirement {
  return updateRequirement(
    requirementId,
    (requirement) => {
      if (
        requirement.status !==
        "in-progress"
      ) {
        throw new Error(
          "Responses can only be recorded while the mandatory Circle module is in progress.",
        );
      }

      const existing =
        requirement.assessmentResponses.find(
          (item) =>
            item.questionId ===
            response.questionId,
        );

      return {
        ...requirement,
        assessmentResponses: existing
          ? requirement.assessmentResponses.map(
              (item) =>
                item.questionId ===
                response.questionId
                  ? response
                  : item,
            )
          : [
              ...requirement.assessmentResponses,
              response,
            ],
      };
    },
  );
}

export function acceptCircleTrainingAcknowledgement(
  requirementId: string,
): CircleTrainingRequirement {
  return updateRequirement(
    requirementId,
    (requirement) => ({
      ...requirement,
      learnerAcknowledgementAcceptedAt:
        now(),
    }),
  );
}

function validateResponses(
  requirement: CircleTrainingRequirement,
): string[] {
  const module =
    getParticipantSpecificModule(
      requirement.moduleId,
    );

  if (!module) {
    return [
      "The participant-specific module definition could not be found.",
    ];
  }

  const errors: string[] = [];

  if (
    !requirement.learnerAcknowledgementAcceptedAt
  ) {
    errors.push(
      "The Circle member acknowledgement must be accepted before submission.",
    );
  }

  for (const question of module.questions) {
    const response =
      requirement.assessmentResponses.find(
        (item) =>
          item.questionId === question.id,
      );

    if (!response) {
      errors.push(
        `Question ${question.order} has not been answered.`,
      );
      continue;
    }

    if (
      question.options.length > 0 &&
      response.selectedOptionIds.length === 0
    ) {
      errors.push(
        `Question ${question.order} requires an option selection.`,
      );
    }

    if (
      question.minimumResponseLength > 0 &&
      response.response.trim().length <
        question.minimumResponseLength
    ) {
      errors.push(
        `Question ${question.order} requires at least ${question.minimumResponseLength} characters.`,
      );
    }
  }

  return errors;
}

function scoreObjectiveQuestions(
  requirement: CircleTrainingRequirement,
): {
  score: number;
  criticalQuestionsPassed: boolean;
} {
  const module =
    getParticipantSpecificModule(
      requirement.moduleId,
    );

  if (!module) {
    return {
      score: 0,
      criticalQuestionsPassed: false,
    };
  }

  const objectiveQuestions =
    module.questions.filter(
      (question) =>
        question.options.length > 0,
    );

  if (objectiveQuestions.length === 0) {
    return {
      score: 100,
      criticalQuestionsPassed: true,
    };
  }

  let correct = 0;
  let criticalQuestionsPassed = true;

  for (const question of objectiveQuestions) {
    const response =
      requirement.assessmentResponses.find(
        (item) =>
          item.questionId === question.id,
      );

    const expected = [
      ...question.correctOptionIds,
    ].sort();

    const actual = [
      ...(response?.selectedOptionIds ??
        []),
    ].sort();

    const matches =
      expected.length === actual.length &&
      expected.every(
        (value, index) =>
          value === actual[index],
      );

    if (matches) {
      correct += 1;
    } else if (question.critical) {
      criticalQuestionsPassed = false;
    }
  }

  return {
    score: Math.round(
      (correct /
        objectiveQuestions.length) *
        100,
    ),
    criticalQuestionsPassed,
  };
}

export function submitCircleTrainingRequirement(
  requirementId: string,
): CircleTrainingRequirement {
  return updateRequirement(
    requirementId,
    (requirement) => {
      if (
        requirement.status !==
        "in-progress"
      ) {
        throw new Error(
          "Only an in-progress mandatory Circle module can be submitted.",
        );
      }

      const errors =
        validateResponses(requirement);

      if (errors.length > 0) {
        throw new Error(errors[0]);
      }

      const module =
        getParticipantSpecificModule(
          requirement.moduleId,
        );

      if (!module) {
        throw new Error(
          "The participant-specific module definition could not be found.",
        );
      }

      const result =
        scoreObjectiveQuestions(
          requirement,
        );

      const readyForCompletion =
        result.score >=
          module.minimumKnowledgeScore &&
        (!module.criticalQuestionsMustPass ||
          result.criticalQuestionsPassed);

      if (!readyForCompletion) {
        return {
          ...requirement,
          status: "changes-requested",
          submittedAt: now(),
          knowledgeScore: result.score,
          criticalQuestionsPassed:
            result.criticalQuestionsPassed,
          participantDecision:
            "changes-requested",
          participantDecisionNote:
            "The assessment standard has not yet been met. Review the participant-specific module and try again.",
          participantDecisionAt: now(),
        };
      }

      const submittedAt = now();

      const participantDecision =
        module.participantApprovalRequired
          ? "pending"
          : "approved";

      const participantDecisionAt =
        module.participantApprovalRequired
          ? null
          : submittedAt;

      const completesImmediately =
        !module.participantApprovalRequired &&
        !module.humanReviewRequired;

      return {
        ...requirement,
        status: completesImmediately
          ? "completed"
          : "submitted",
        submittedAt,
        knowledgeScore: result.score,
        criticalQuestionsPassed:
          result.criticalQuestionsPassed,
        participantDecision,
        participantDecisionNote: "",
        participantDecisionAt,
        completedAt: completesImmediately
          ? submittedAt
          : null,
        expiresAt:
          completesImmediately &&
          module.renewalMonths
            ? addMonths(
                submittedAt,
                module.renewalMonths,
              )
            : requirement.expiresAt,
      };
    },
  );
}

export function approveCircleTrainingRequirement(
  requirementId: string,
  participantNote: string,
): CircleTrainingRequirement {
  return updateRequirement(
    requirementId,
    (requirement) => {
      const module =
        getParticipantSpecificModule(
          requirement.moduleId,
        );

      if (!module) {
        throw new Error(
          "The participant-specific module definition could not be found.",
        );
      }

      if (
        requirement.status !==
        "submitted"
      ) {
        throw new Error(
          "Only a submitted mandatory Circle module can be approved.",
        );
      }

      const participantDecisionAt = now();

      const reviewerComplete =
        !module.humanReviewRequired ||
        requirement.reviewerDecision ===
          "satisfactory";

      return {
        ...requirement,
        participantDecision: "approved",
        participantDecisionNote:
          participantNote.trim(),
        participantDecisionAt,
        status: reviewerComplete
          ? "completed"
          : "submitted",
        completedAt: reviewerComplete
          ? participantDecisionAt
          : null,
        expiresAt:
          reviewerComplete &&
          module.renewalMonths
            ? addMonths(
                participantDecisionAt,
                module.renewalMonths,
              )
            : requirement.expiresAt,
      };
    },
  );
}

export function requestCircleTrainingChanges(
  requirementId: string,
  participantNote: string,
): CircleTrainingRequirement {
  if (!participantNote.trim()) {
    throw new Error(
      "Explain what the Circle member needs to understand or change.",
    );
  }

  return updateRequirement(
    requirementId,
    (requirement) => ({
      ...requirement,
      status: "changes-requested",
      participantDecision:
        "changes-requested",
      participantDecisionNote:
        participantNote.trim(),
      participantDecisionAt: now(),
      completedAt: null,
    }),
  );
}

export function recordCircleTrainingReviewerDecision(
  requirementId: string,
  decision:
    | "satisfactory"
    | "changes-requested",
  reviewerNote: string,
): CircleTrainingRequirement {
  if (!reviewerNote.trim()) {
    throw new Error(
      "A reviewer note is required.",
    );
  }

  return updateRequirement(
    requirementId,
    (requirement) => {
      const module =
        getParticipantSpecificModule(
          requirement.moduleId,
        );

      if (!module) {
        throw new Error(
          "The participant-specific module definition could not be found.",
        );
      }

      if (!module.humanReviewRequired) {
        throw new Error(
          "This participant-specific module does not require an additional reviewer.",
        );
      }

      const reviewerDecisionAt = now();

      const participantApproved =
        !module.participantApprovalRequired ||
        requirement.participantDecision ===
          "approved";

      const complete =
        decision === "satisfactory" &&
        participantApproved;

      return {
        ...requirement,
        reviewerDecision: decision,
        reviewerDecisionNote:
          reviewerNote.trim(),
        reviewerDecisionAt,
        status:
          decision ===
          "changes-requested"
            ? "changes-requested"
            : complete
              ? "completed"
              : "submitted",
        completedAt: complete
          ? reviewerDecisionAt
          : null,
        expiresAt:
          complete &&
          module.renewalMonths
            ? addMonths(
                reviewerDecisionAt,
                module.renewalMonths,
              )
            : requirement.expiresAt,
      };
    },
  );
}

function addMonths(
  isoDate: string,
  months: number,
): string {
  const date = new Date(isoDate);
  date.setUTCMonth(
    date.getUTCMonth() + months,
  );
  return date.toISOString();
}