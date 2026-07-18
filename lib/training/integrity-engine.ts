import type {
  AssessmentAttempt,
  AssessmentQuestion,
  IntegrityFlag,
  IntegrityFlagSeverity,
  TrainingModule,
} from "./types";

export type IntegrityReviewInput = {
  workerApplicationId: string;
  moduleAttemptId: string;
  assessmentAttempt: AssessmentAttempt;
  module: TrainingModule;
  previousAttempts?: AssessmentAttempt[];
  knownLearnerResponses?: string[];
};

export type IntegrityReviewResult = {
  flags: IntegrityFlag[];
  summary: string;
  requiresHumanReview: boolean;
  hasCriticalConcern: boolean;
};

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

function normaliseText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getWordCount(value: string): number {
  const normalised = normaliseText(value);

  return normalised
    ? normalised.split(" ").length
    : 0;
}

function getQuestion(
  module: TrainingModule,
  questionId: string,
): AssessmentQuestion | null {
  return (
    module.questionBank.find(
      (question) =>
        question.id === questionId,
    ) ?? null
  );
}

function createFlag(
  input: IntegrityReviewInput,
  type: IntegrityFlag["type"],
  reason: string,
  severity: IntegrityFlagSeverity,
  evidenceReferences: string[],
): IntegrityFlag {
  return {
    id: createId("integrity-flag"),
    workerApplicationId:
      input.workerApplicationId,
    moduleAttemptId:
      input.moduleAttemptId,
    type,
    reason,
    evidenceReferences,
    severity,
    status: "open",
    createdAt: now(),
    resolvedAt: null,
    reviewerNote: "",
    reviewerId: null,
  };
}

function createAnswerTooFastFlags(
  input: IntegrityReviewInput,
): IntegrityFlag[] {
  return input.assessmentAttempt.answers
    .filter((answer) => {
      const started =
        Date.parse(answer.startedAt);
      const answered =
        Date.parse(answer.answeredAt);

      if (
        Number.isNaN(started) ||
        Number.isNaN(answered)
      ) {
        return false;
      }

      const elapsedSeconds =
        Math.max(
          0,
          (answered - started) / 1000,
        );

      const question = getQuestion(
        input.module,
        answer.questionId,
      );

      if (!question) {
        return false;
      }

      if (
        [
          "scenario",
          "reflection",
          "short-answer",
        ].includes(question.type)
      ) {
        return (
          answer.response.trim().length >= 100 &&
          elapsedSeconds < 20
        );
      }

      return elapsedSeconds < 2;
    })
    .map((answer) =>
      createFlag(
        input,
        "answer-too-fast",
        `Question ${answer.questionId} was answered unusually quickly and should be checked with the learner.`,
        "low",
        [
          input.assessmentAttempt.id,
          answer.questionId,
        ],
      ),
    );
}

function createVagueReflectionFlags(
  input: IntegrityReviewInput,
): IntegrityFlag[] {
  return input.assessmentAttempt.answers
    .filter((answer) => {
      const question = getQuestion(
        input.module,
        answer.questionId,
      );

      if (
        !question ||
        question.type !== "reflection"
      ) {
        return false;
      }

      const wordCount = getWordCount(
        answer.response,
      );

      const genericPhrases = [
        "i will always respect participants",
        "i will do the right thing",
        "i will follow policy",
        "everyone deserves respect",
      ];

      const normalised =
        normaliseText(answer.response);

      return (
        wordCount < 70 ||
        genericPhrases.some(
          (phrase) =>
            normalised === phrase,
        )
      );
    })
    .map((answer) =>
      createFlag(
        input,
        "vague-reflection",
        `Reflection ${answer.questionId} may not contain enough specific evidence of the learner's own understanding.`,
        "medium",
        [
          input.assessmentAttempt.id,
          answer.questionId,
        ],
      ),
    );
}

function createCopiedLanguageFlags(
  input: IntegrityReviewInput,
): IntegrityFlag[] {
  const sourceTexts = [
    ...input.module.sections.flatMap(
      (section) =>
        section.contentBlocks.map(
          (block) => block.content,
        ),
    ),
    ...(input.knownLearnerResponses ?? []),
  ]
    .map(normaliseText)
    .filter(
      (value) => value.length >= 80,
    );

  return input.assessmentAttempt.answers
    .filter((answer) => {
      const response =
        normaliseText(answer.response);

      if (response.length < 80) {
        return false;
      }

      return sourceTexts.some(
        (source) =>
          source.includes(response) ||
          response.includes(source),
      );
    })
    .map((answer) =>
      createFlag(
        input,
        "copied-language-suspected",
        `Response ${answer.questionId} closely matches existing training or learner wording and should be discussed with the learner.`,
        "medium",
        [
          input.assessmentAttempt.id,
          answer.questionId,
        ],
      ),
    );
}

function createRepeatedAnswerFlags(
  input: IntegrityReviewInput,
): IntegrityFlag[] {
  const previousResponses =
    (input.previousAttempts ?? [])
      .flatMap(
        (attempt) => attempt.answers,
      )
      .map((answer) => ({
        questionId: answer.questionId,
        response:
          normaliseText(answer.response),
      }))
      .filter(
        (answer) =>
          answer.response.length >= 80,
      );

  return input.assessmentAttempt.answers
    .filter((answer) => {
      const response =
        normaliseText(answer.response);

      if (response.length < 80) {
        return false;
      }

      return previousResponses.some(
        (previous) =>
          previous.questionId !==
            answer.questionId &&
          previous.response === response,
      );
    })
    .map((answer) =>
      createFlag(
        input,
        "unusual-answer-pattern",
        `Response ${answer.questionId} is identical to a response used for a different question in an earlier attempt.`,
        "medium",
        [
          input.assessmentAttempt.id,
          answer.questionId,
        ],
      ),
    );
}

function createContradictionFlags(
  input: IntegrityReviewInput,
): IntegrityFlag[] {
  const answers =
    input.assessmentAttempt.answers.map(
      (answer) => ({
        questionId: answer.questionId,
        text: normaliseText(
          answer.response,
        ),
      }),
    );

  const unsafeConsentStatements = [
    "routine overrides consent",
    "must follow the routine",
    "family decides even when participant says no",
    "continue even if consent is withdrawn",
  ];

  const safeConsentStatements = [
    "respect the refusal",
    "consent can be withdrawn",
    "do not pressure",
    "participant remains in control",
  ];

  const hasUnsafe =
    answers.some((answer) =>
      unsafeConsentStatements.some(
        (statement) =>
          answer.text.includes(statement),
      ),
    );

  const hasSafe =
    answers.some((answer) =>
      safeConsentStatements.some(
        (statement) =>
          answer.text.includes(statement),
      ),
    );

  if (!hasUnsafe || !hasSafe) {
    return [];
  }

  return [
    createFlag(
      input,
      "contradictory-responses",
      "The assessment contains conflicting statements about consent, refusal or participant control.",
      "critical",
      [
        input.assessmentAttempt.id,
      ],
    ),
  ];
}

function createCriticalSafetyFlags(
  input: IntegrityReviewInput,
): IntegrityFlag[] {
  const flags: IntegrityFlag[] = [];

  for (
    const answer of
      input.assessmentAttempt.answers
  ) {
    const question = getQuestion(
      input.module,
      answer.questionId,
    );

    if (
      !question ||
      !question.critical ||
      !question.criticalFailureIndicators
        ?.length
    ) {
      continue;
    }

    const response =
      normaliseText(answer.response);

    for (
      const indicator of
        question.criticalFailureIndicators
    ) {
      const normalisedIndicator =
        normaliseText(indicator);

      if (
        normalisedIndicator &&
        response.includes(
          normalisedIndicator,
        )
      ) {
        flags.push(
          createFlag(
            input,
            "critical-safety-error",
            `Response ${answer.questionId} contains a critical safety concern: ${indicator}.`,
            "critical",
            [
              input.assessmentAttempt.id,
              answer.questionId,
            ],
          ),
        );
      }
    }
  }

  return flags;
}

function deduplicateFlags(
  flags: IntegrityFlag[],
): IntegrityFlag[] {
  const seen = new Set<string>();

  return flags.filter((flag) => {
    const key = [
      flag.type,
      flag.reason,
      ...flag.evidenceReferences,
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function reviewAssessmentIntegrity(
  input: IntegrityReviewInput,
): IntegrityReviewResult {
  const flags = deduplicateFlags([
    ...createAnswerTooFastFlags(input),
    ...createVagueReflectionFlags(input),
    ...createCopiedLanguageFlags(input),
    ...createRepeatedAnswerFlags(input),
    ...createContradictionFlags(input),
    ...createCriticalSafetyFlags(input),
  ]);

  const hasCriticalConcern =
    flags.some(
      (flag) =>
        flag.severity === "critical",
    );

  return {
    flags,
    summary:
      flags.length === 0
        ? "No automated integrity concerns were identified. Human review is still required."
        : `${flags.length} automated integrity concern${
            flags.length === 1
              ? ""
              : "s"
          } require human review.`,
    requiresHumanReview: true,
    hasCriticalConcern,
  };
}

export function resolveIntegrityFlag(
  flag: IntegrityFlag,
  reviewerId: string,
  reviewerNote: string,
): IntegrityFlag {
  if (!reviewerNote.trim()) {
    throw new Error(
      "A reviewer note is required to resolve an integrity flag.",
    );
  }

  return {
    ...flag,
    status: "resolved",
    resolvedAt: now(),
    reviewerId,
    reviewerNote:
      reviewerNote.trim(),
  };
}

export function confirmIntegrityFlag(
  flag: IntegrityFlag,
  reviewerId: string,
  reviewerNote: string,
): IntegrityFlag {
  if (!reviewerNote.trim()) {
    throw new Error(
      "A reviewer note is required to confirm an integrity flag.",
    );
  }

  return {
    ...flag,
    status: "confirmed",
    resolvedAt: now(),
    reviewerId,
    reviewerNote:
      reviewerNote.trim(),
  };
}