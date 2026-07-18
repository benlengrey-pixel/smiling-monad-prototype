import type {
  AIReviewResult,
  AssessmentAnswer,
  AssessmentAttempt,
  AssessmentQuestion,
  IntegrityFlag,
  TrainingAssessmentSelectionRules,
  TrainingModule,
} from "./types";

type RandomSource = () => number;

export type ObjectiveQuestionResult = {
  questionId: string;
  correct: boolean;
  earnedPoints: number;
  availablePoints: number;
  critical: boolean;
};

export type ObjectiveAssessmentResult = {
  earnedPoints: number;
  availablePoints: number;
  percentage: number;
  criticalQuestionsPassed: boolean;
  questionResults: ObjectiveQuestionResult[];
};

export type AssessmentSubmissionCheck = {
  valid: boolean;
  errors: string[];
};

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

function now(): string {
  return new Date().toISOString();
}

function shuffle<T>(
  values: T[],
  random: RandomSource,
): T[] {
  const result = [...values];

  for (
    let index = result.length - 1;
    index > 0;
    index -= 1
  ) {
    const replacement = Math.floor(
      random() * (index + 1),
    );

    [result[index], result[replacement]] = [
      result[replacement],
      result[index],
    ];
  }

  return result;
}

function uniqueById(
  questions: AssessmentQuestion[],
): AssessmentQuestion[] {
  const seen = new Set<string>();

  return questions.filter((question) => {
    if (seen.has(question.id)) {
      return false;
    }

    seen.add(question.id);
    return true;
  });
}

function selectFromPool(
  pool: AssessmentQuestion[],
  count: number,
  selectedIds: Set<string>,
  random: RandomSource,
): AssessmentQuestion[] {
  const candidates = shuffle(
    pool.filter(
      (question) =>
        !selectedIds.has(question.id),
    ),
    random,
  );

  const selected = candidates.slice(
    0,
    Math.max(0, count),
  );

  for (const question of selected) {
    selectedIds.add(question.id);
  }

  return selected;
}

export function selectAssessmentQuestions(
  module: TrainingModule,
  rules: TrainingAssessmentSelectionRules,
  random: RandomSource = Math.random,
): AssessmentQuestion[] {
  const availableQuestions =
    module.questionBank.filter(
      (question) =>
        question.available &&
        question.type !==
          "reviewer-question",
    );

  if (
    availableQuestions.length <
    rules.totalQuestions
  ) {
    throw new Error(
      "The question bank does not contain enough available questions for this assessment.",
    );
  }

  const selected: AssessmentQuestion[] =
    [];
  const selectedIds = new Set<string>();

  const criticalQuestions =
    availableQuestions.filter(
      (question) => question.critical,
    );

  if (
    criticalQuestions.length <
    rules.minimumCriticalQuestions
  ) {
    throw new Error(
      "The question bank does not contain enough critical questions.",
    );
  }

  selected.push(
    ...selectFromPool(
      criticalQuestions,
      rules.minimumCriticalQuestions,
      selectedIds,
      random,
    ),
  );

  for (const requiredType of rules.requiredQuestionTypes) {
    if (
      selected.some(
        (question) =>
          question.type === requiredType,
      )
    ) {
      continue;
    }

    const matching = selectFromPool(
      availableQuestions.filter(
        (question) =>
          question.type === requiredType,
      ),
      1,
      selectedIds,
      random,
    );

    if (matching.length === 0) {
      throw new Error(
        `No available assessment question exists for required type ${requiredType}.`,
      );
    }

    selected.push(...matching);
  }

  const remainingCount =
    rules.totalQuestions - selected.length;

  if (remainingCount > 0) {
    selected.push(
      ...selectFromPool(
        availableQuestions,
        remainingCount,
        selectedIds,
        random,
      ),
    );
  }

  const finalSelection = uniqueById(
    selected,
  ).slice(0, rules.totalQuestions);

  if (
    finalSelection.length !==
    rules.totalQuestions
  ) {
    throw new Error(
      "Unable to create a complete assessment question set.",
    );
  }

  return rules.randomiseQuestionOrder
    ? shuffle(finalSelection, random)
    : finalSelection;
}

export function createAssessmentQuestionSet(
  module: TrainingModule,
  rules: TrainingAssessmentSelectionRules,
  random: RandomSource = Math.random,
): {
  questionSetId: string;
  questionIds: string[];
} {
  const selected =
    selectAssessmentQuestions(
      module,
      rules,
      random,
    );

  return {
    questionSetId: createId(
      "question-set",
    ),
    questionIds: selected.map(
      (question) => question.id,
    ),
  };
}

function normaliseOptionIds(
  optionIds: string[],
): string[] {
  return [...new Set(optionIds)].sort();
}

function arraysMatch(
  left: string[],
  right: string[],
): boolean {
  const normalisedLeft =
    normaliseOptionIds(left);
  const normalisedRight =
    normaliseOptionIds(right);

  return (
    normalisedLeft.length ===
      normalisedRight.length &&
    normalisedLeft.every(
      (value, index) =>
        value === normalisedRight[index],
    )
  );
}

function isObjectiveQuestion(
  question: AssessmentQuestion,
): boolean {
  return [
    "multiple-choice",
    "multiple-select",
    "true-false",
    "matching",
  ].includes(question.type);
}

export function scoreObjectiveQuestions(
  module: TrainingModule,
  attempt: AssessmentAttempt,
): ObjectiveAssessmentResult {
  const questions =
    attempt.questionOrder
      .map((questionId) =>
        module.questionBank.find(
          (question) =>
            question.id === questionId,
        ),
      )
      .filter(
        (
          question,
        ): question is AssessmentQuestion =>
          Boolean(question),
      );

  const objectiveQuestions =
    questions.filter(
      isObjectiveQuestion,
    );

  const questionResults =
    objectiveQuestions.map(
      (question) => {
        const answer =
          attempt.answers.find(
            (candidate) =>
              candidate.questionId ===
              question.id,
          );

        const correct = Boolean(
          answer &&
            arraysMatch(
              answer.selectedOptionIds,
              question.correctOptionIds ?? [],
            ),
        );

        return {
          questionId: question.id,
          correct,
          earnedPoints: correct
            ? question.points
            : 0,
          availablePoints:
            question.points,
          critical: question.critical,
        };
      },
    );

  const earnedPoints =
    questionResults.reduce(
      (total, result) =>
        total + result.earnedPoints,
      0,
    );

  const availablePoints =
    questionResults.reduce(
      (total, result) =>
        total +
        result.availablePoints,
      0,
    );

  const percentage =
    availablePoints === 0
      ? 0
      : Math.round(
          (earnedPoints /
            availablePoints) *
            100,
        );

  const criticalQuestionsPassed =
    questionResults
      .filter(
        (result) => result.critical,
      )
      .every((result) => result.correct);

  return {
    earnedPoints,
    availablePoints,
    percentage,
    criticalQuestionsPassed,
    questionResults,
  };
}

export function validateAssessmentSubmission(
  module: TrainingModule,
  attempt: AssessmentAttempt,
  learnerDeclarationAccepted: boolean,
): AssessmentSubmissionCheck {
  const errors: string[] = [];

  if (attempt.status !== "active") {
    errors.push(
      "Only an active assessment attempt can be submitted.",
    );
  }

  if (!learnerDeclarationAccepted) {
    errors.push(
      "The learner declaration must be accepted before submission.",
    );
  }

  for (const questionId of attempt.questionOrder) {
    const question =
      module.questionBank.find(
        (candidate) =>
          candidate.id === questionId,
      );

    if (!question) {
      errors.push(
        `Question ${questionId} is missing from module version ${module.version}.`,
      );
      continue;
    }

    const answer =
      attempt.answers.find(
        (candidate) =>
          candidate.questionId ===
          questionId,
      );

    if (!answer) {
      errors.push(
        `Question ${questionId} has not been answered.`,
      );
      continue;
    }

    const writtenResponse =
      answer.response.trim();

    const requiresWrittenResponse = [
      "short-answer",
      "scenario",
      "reflection",
    ].includes(question.type);

    if (
      requiresWrittenResponse &&
      writtenResponse.length === 0
    ) {
      errors.push(
        `Question ${questionId} requires a written response.`,
      );
    }

    if (
      question.minimumResponseLength &&
      writtenResponse.length <
        question.minimumResponseLength
    ) {
      errors.push(
        `Question ${questionId} requires at least ${question.minimumResponseLength} characters.`,
      );
    }

    const requiresOptions =
      isObjectiveQuestion(question);

    if (
      requiresOptions &&
      answer.selectedOptionIds.length === 0
    ) {
      errors.push(
        `Question ${questionId} requires an option selection.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createObjectiveCriticalFailureFlags(
  workerApplicationId: string,
  moduleAttemptId: string,
  assessmentAttemptId: string,
  module: TrainingModule,
  result: ObjectiveAssessmentResult,
): IntegrityFlag[] {
  return result.questionResults
    .filter(
      (questionResult) =>
        questionResult.critical &&
        !questionResult.correct,
    )
    .map((questionResult) => {
      const question =
        module.questionBank.find(
          (candidate) =>
            candidate.id ===
            questionResult.questionId,
        );

      return {
        id: createId(
          "integrity-flag",
        ),
        workerApplicationId,
        moduleAttemptId:
          assessmentAttemptId ||
          moduleAttemptId,
        type:
          "critical-safety-error" as const,
        reason:
          question?.prompt ??
          "A critical safety question was answered incorrectly.",
        evidenceReferences: [
          assessmentAttemptId,
          questionResult.questionId,
        ],
        severity: "critical" as const,
        status: "open" as const,
        createdAt: now(),
        resolvedAt: null,
        reviewerNote: "",
        reviewerId: null,
      };
    });
}

export function createInitialAIReview(
  objectiveResult: ObjectiveAssessmentResult,
  integrityFlags: IntegrityFlag[],
): AIReviewResult {
  const criticalFlags =
    integrityFlags.filter(
      (flag) =>
        flag.severity === "critical",
    );

  if (criticalFlags.length > 0) {
    return {
      decision: "critical-failure",
      summary:
        "One or more critical safety answers require further learning and human review.",
      matchedRequiredElements: [],
      missingRequiredElements: [],
      detectedCriticalFailures:
        criticalFlags.map(
          (flag) => flag.reason,
        ),
      integrityFlagIds:
        criticalFlags.map(
          (flag) => flag.id,
        ),
      reviewedAt: now(),
      modelReference: null,
    };
  }

  return {
    decision:
      objectiveResult.percentage >= 80
        ? "human-review-required"
        : "human-review-required",
    summary:
      objectiveResult.percentage >= 80
        ? "Objective questions meet the provisional score threshold. Written responses and practical understanding still require review."
        : "The objective score is below the module threshold. Written responses and the full evidence record still require review.",
    matchedRequiredElements: [],
    missingRequiredElements: [],
    detectedCriticalFailures: [],
    integrityFlagIds:
      integrityFlags.map(
        (flag) => flag.id,
      ),
    reviewedAt: now(),
    modelReference: null,
  };
}

export function applyObjectiveAssessmentResult(
  attempt: AssessmentAttempt,
  objectiveResult: ObjectiveAssessmentResult,
  aiReview: AIReviewResult,
): AssessmentAttempt {
  if (
    attempt.status !== "submitted" &&
    attempt.status !== "human-review"
  ) {
    throw new Error(
      "Objective results may only be applied after assessment submission.",
    );
  }

  return {
    ...attempt,
    knowledgeScore:
      objectiveResult.percentage,
    criticalQuestionsPassed:
      objectiveResult.criticalQuestionsPassed,
    aiReview,
    status: "human-review",
  };
}

export function createAssessmentAnswer(
  question: AssessmentQuestion,
  response: string,
  selectedOptionIds: string[],
  startedAt: string,
  aiAssistanceDeclared = false,
): AssessmentAnswer {
  return {
    questionId: question.id,
    questionVersion:
      question.moduleVersion,
    response,
    selectedOptionIds:
      normaliseOptionIds(
        selectedOptionIds,
      ),
    startedAt,
    answeredAt: now(),
    changedBeforeSubmission: false,
    aiAssistanceDeclared,
  };
}