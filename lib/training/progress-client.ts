import type {
  AssessmentAnswer,
  AssessmentAttempt,
  IntegrityFlag,
  ReviewerDecision,
  SectionProgress,
  TrainingAuditEvent,
  TrainingModule,
  TrainingRecord,
  WorkerModuleAttempt,
} from "./types";

const TRAINING_STORAGE_KEY =
  "smiling-monad-training-records-v1";

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

function readAllTrainingRecords(): TrainingRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = window.localStorage.getItem(
    TRAINING_STORAGE_KEY,
  );

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? (parsed as TrainingRecord[])
      : [];
  } catch {
    return [];
  }
}

function saveAllTrainingRecords(
  records: TrainingRecord[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    TRAINING_STORAGE_KEY,
    JSON.stringify(records),
  );

  window.dispatchEvent(
    new CustomEvent(
      "smiling-monad-training-updated",
    ),
  );
}

function updateTrainingRecord(
  workerApplicationId: string,
  updater: (
    record: TrainingRecord,
  ) => TrainingRecord,
): TrainingRecord {
  const records = readAllTrainingRecords();
  const index = records.findIndex(
    (record) =>
      record.workerApplicationId ===
      workerApplicationId,
  );

  if (index < 0) {
    throw new Error(
      "Training record not found for this worker application.",
    );
  }

  const updated = updater(records[index]);
  records[index] = updated;
  saveAllTrainingRecords(records);

  return updated;
}

function createAuditEvent(
  workerApplicationId: string,
  moduleId: string,
  type: TrainingAuditEvent["type"],
  detail: string,
  actorType: TrainingAuditEvent["actorType"],
  actorId: string | null = null,
  attemptId: string | null = null,
): TrainingAuditEvent {
  return {
    id: createId("audit"),
    workerApplicationId,
    moduleId,
    attemptId,
    type,
    actorType,
    actorId,
    detail,
    createdAt: now(),
  };
}

function createSectionProgress(
  module: TrainingModule,
): SectionProgress[] {
  return module.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      sectionId: section.id,
      status: "not-started",
      startedAt: null,
      completedAt: null,
      engagementSeconds: 0,
      completionResponse: "",
    }));
}

function createModuleAttempt(
  workerApplicationId: string,
  module: TrainingModule,
): WorkerModuleAttempt {
  return {
    id: createId("module-attempt"),
    workerApplicationId,
    moduleId: module.id,
    moduleVersion: module.version,
    status: "not-started",
    startedAt: null,
    submittedAt: null,
    completedAt: null,
    sectionProgress:
      createSectionProgress(module),
    assessmentAttempts: [],
    integrityFlags: [],
    reviewerDecision: null,
    learnerDeclarationAcceptedAt: null,
    externalEvidenceRecordIds: [],
  };
}

export function readTrainingRecord(
  workerApplicationId: string,
): TrainingRecord | null {
  return (
    readAllTrainingRecords().find(
      (record) =>
        record.workerApplicationId ===
        workerApplicationId,
    ) ?? null
  );
}

export function subscribeToTrainingRecords(
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
    "smiling-monad-training-updated",
    handler,
  );

  return () => {
    window.removeEventListener(
      "storage",
      handler,
    );
    window.removeEventListener(
      "smiling-monad-training-updated",
      handler,
    );
  };
}

export function enrolWorkerInTrainingProgram(
  workerApplicationId: string,
  programId: string,
  programVersion: string,
  modules: TrainingModule[],
): TrainingRecord {
  const records = readAllTrainingRecords();
  const existing = records.find(
    (record) =>
      record.workerApplicationId ===
      workerApplicationId,
  );

  if (existing) {
    return existing;
  }

  const moduleAttempts = modules.map((module) =>
    createModuleAttempt(
      workerApplicationId,
      module,
    ),
  );

  const enrolledAt = now();

  const record: TrainingRecord = {
    workerApplicationId,
    programId,
    programVersion,
    enrolledAt,
    completedAt: null,
    moduleAttempts,
    auditEvents: [
      createAuditEvent(
        workerApplicationId,
        modules[0]?.id ?? "program",
        "program-created",
        `Worker enrolled in training program ${programId} version ${programVersion}.`,
        "system",
      ),
    ],
  };

  records.push(record);
  saveAllTrainingRecords(records);

  return record;
}

export function openTrainingSection(
  workerApplicationId: string,
  moduleId: string,
  sectionId: string,
): TrainingRecord {
  return updateTrainingRecord(
    workerApplicationId,
    (record) => ({
      ...record,
      moduleAttempts:
        record.moduleAttempts.map(
          (moduleAttempt) => {
            if (
              moduleAttempt.moduleId !==
              moduleId
            ) {
              return moduleAttempt;
            }

            return {
              ...moduleAttempt,
              status:
                moduleAttempt.status ===
                "not-started"
                  ? "learning"
                  : moduleAttempt.status,
              startedAt:
                moduleAttempt.startedAt ??
                now(),
              sectionProgress:
                moduleAttempt.sectionProgress.map(
                  (section) =>
                    section.sectionId ===
                    sectionId
                      ? {
                          ...section,
                          status:
                            section.status ===
                            "completed"
                              ? "completed"
                              : "in-progress",
                          startedAt:
                            section.startedAt ??
                            now(),
                        }
                      : section,
                ),
            };
          },
        ),
      auditEvents: [
        ...record.auditEvents,
        createAuditEvent(
          workerApplicationId,
          moduleId,
          "section-opened",
          `Opened section ${sectionId}.`,
          "learner",
        ),
      ],
    }),
  );
}

export function recordSectionEngagement(
  workerApplicationId: string,
  moduleId: string,
  sectionId: string,
  additionalSeconds: number,
): TrainingRecord {
  const safeSeconds = Math.max(
    0,
    Math.floor(additionalSeconds),
  );

  return updateTrainingRecord(
    workerApplicationId,
    (record) => ({
      ...record,
      moduleAttempts:
        record.moduleAttempts.map(
          (moduleAttempt) =>
            moduleAttempt.moduleId ===
            moduleId
              ? {
                  ...moduleAttempt,
                  sectionProgress:
                    moduleAttempt.sectionProgress.map(
                      (section) =>
                        section.sectionId ===
                        sectionId
                          ? {
                              ...section,
                              engagementSeconds:
                                section.engagementSeconds +
                                safeSeconds,
                            }
                          : section,
                    ),
                }
              : moduleAttempt,
        ),
    }),
  );
}

export function completeTrainingSection(
  workerApplicationId: string,
  module: TrainingModule,
  sectionId: string,
  completionResponse: string,
): TrainingRecord {
  const sectionDefinition =
    module.sections.find(
      (section) =>
        section.id === sectionId,
    );

  if (!sectionDefinition) {
    throw new Error(
      "Training section not found.",
    );
  }

  return updateTrainingRecord(
    workerApplicationId,
    (record) => {
      const moduleAttempt =
        record.moduleAttempts.find(
          (attempt) =>
            attempt.moduleId === module.id,
        );

      if (!moduleAttempt) {
        throw new Error(
          "Module attempt not found.",
        );
      }

      const sectionProgress =
        moduleAttempt.sectionProgress.find(
          (section) =>
            section.sectionId ===
            sectionId,
        );

      if (!sectionProgress) {
        throw new Error(
          "Section progress not found.",
        );
      }

      if (
        sectionProgress.engagementSeconds <
        sectionDefinition.minimumEngagementSeconds
      ) {
        throw new Error(
          "Minimum section engagement has not yet been reached.",
        );
      }

      if (
        completionResponse.trim().length <
        30
      ) {
        throw new Error(
          "Please provide a more complete response before finishing this section.",
        );
      }

      return {
        ...record,
        moduleAttempts:
          record.moduleAttempts.map(
            (attempt) =>
              attempt.moduleId ===
              module.id
                ? {
                    ...attempt,
                    status: "learning",
                    sectionProgress:
                      attempt.sectionProgress.map(
                        (section) =>
                          section.sectionId ===
                          sectionId
                            ? {
                                ...section,
                                status:
                                  "completed",
                                completedAt:
                                  now(),
                                completionResponse:
                                  completionResponse.trim(),
                              }
                            : section,
                      ),
                  }
                : attempt,
          ),
        auditEvents: [
          ...record.auditEvents,
          createAuditEvent(
            workerApplicationId,
            module.id,
            "section-completed",
            `Completed section ${sectionId}.`,
            "learner",
          ),
        ],
      };
    },
  );
}

function allRequiredSectionsComplete(
  module: TrainingModule,
  attempt: WorkerModuleAttempt,
): boolean {
  const requiredSectionIds =
    module.sections
      .filter((section) => section.required)
      .map((section) => section.id);

  return requiredSectionIds.every(
    (sectionId) =>
      attempt.sectionProgress.find(
        (progress) =>
          progress.sectionId ===
          sectionId,
      )?.status === "completed",
  );
}

export function startAssessmentAttempt(
  workerApplicationId: string,
  module: TrainingModule,
  questionIds: string[],
): TrainingRecord {
  return updateTrainingRecord(
    workerApplicationId,
    (record) => {
      const moduleAttempt =
        record.moduleAttempts.find(
          (attempt) =>
            attempt.moduleId === module.id,
        );

      if (!moduleAttempt) {
        throw new Error(
          "Module attempt not found.",
        );
      }

      if (
        !allRequiredSectionsComplete(
          module,
          moduleAttempt,
        )
      ) {
        throw new Error(
          "All required learning sections must be completed before assessment.",
        );
      }

      const activeAttempt =
        moduleAttempt.assessmentAttempts.find(
          (attempt) =>
            attempt.status === "active",
        );

      if (activeAttempt) {
        return record;
      }

      const attemptNumber =
        moduleAttempt.assessmentAttempts.length +
        1;

      const assessmentAttempt: AssessmentAttempt =
        {
          id: createId(
            "assessment-attempt",
          ),
          workerApplicationId,
          moduleId: module.id,
          moduleVersion:
            module.version,
          attemptNumber,
          questionSetId: createId(
            "question-set",
          ),
          questionOrder: [
            ...questionIds,
          ],
          startedAt: now(),
          submittedAt: null,
          answers: [],
          knowledgeScore: null,
          criticalQuestionsPassed:
            false,
          aiReview: null,
          status: "active",
        };

      return {
        ...record,
        moduleAttempts:
          record.moduleAttempts.map(
            (attempt) =>
              attempt.moduleId ===
              module.id
                ? {
                    ...attempt,
                    status:
                      "assessment",
                    assessmentAttempts: [
                      ...attempt.assessmentAttempts,
                      assessmentAttempt,
                    ],
                  }
                : attempt,
          ),
        auditEvents: [
          ...record.auditEvents,
          createAuditEvent(
            workerApplicationId,
            module.id,
            "assessment-started",
            `Started assessment attempt ${attemptNumber}.`,
            "learner",
            null,
            assessmentAttempt.id,
          ),
        ],
      };
    },
  );
}

export function recordAssessmentAnswer(
  workerApplicationId: string,
  moduleId: string,
  assessmentAttemptId: string,
  answer: AssessmentAnswer,
): TrainingRecord {
  return updateTrainingRecord(
    workerApplicationId,
    (record) => ({
      ...record,
      moduleAttempts:
        record.moduleAttempts.map(
          (moduleAttempt) =>
            moduleAttempt.moduleId ===
            moduleId
              ? {
                  ...moduleAttempt,
                  assessmentAttempts:
                    moduleAttempt.assessmentAttempts.map(
                      (attempt) => {
                        if (
                          attempt.id !==
                          assessmentAttemptId
                        ) {
                          return attempt;
                        }

                        if (
                          attempt.status !==
                          "active"
                        ) {
                          throw new Error(
                            "Submitted assessment attempts cannot be changed.",
                          );
                        }

                        const previous =
                          attempt.answers.find(
                            (item) =>
                              item.questionId ===
                              answer.questionId,
                          );

                        const nextAnswer = {
                          ...answer,
                          changedBeforeSubmission:
                            Boolean(previous) ||
                            answer.changedBeforeSubmission,
                        };

                        return {
                          ...attempt,
                          answers: previous
                            ? attempt.answers.map(
                                (item) =>
                                  item.questionId ===
                                  answer.questionId
                                    ? nextAnswer
                                    : item,
                              )
                            : [
                                ...attempt.answers,
                                nextAnswer,
                              ],
                        };
                      },
                    ),
                }
              : moduleAttempt,
        ),
      auditEvents: [
        ...record.auditEvents,
        createAuditEvent(
          workerApplicationId,
          moduleId,
          "answer-recorded",
          `Recorded answer for question ${answer.questionId}.`,
          "learner",
          null,
          assessmentAttemptId,
        ),
      ],
    }),
  );
}

export function acceptLearnerDeclaration(
  workerApplicationId: string,
  moduleId: string,
): TrainingRecord {
  return updateTrainingRecord(
    workerApplicationId,
    (record) => ({
      ...record,
      moduleAttempts:
        record.moduleAttempts.map(
          (attempt) =>
            attempt.moduleId ===
            moduleId
              ? {
                  ...attempt,
                  learnerDeclarationAcceptedAt:
                    now(),
                }
              : attempt,
        ),
      auditEvents: [
        ...record.auditEvents,
        createAuditEvent(
          workerApplicationId,
          moduleId,
          "answer-recorded",
          "Learner accepted the assessment declaration.",
          "learner",
        ),
      ],
    }),
  );
}

export function submitAssessmentAttempt(
  workerApplicationId: string,
  moduleId: string,
  assessmentAttemptId: string,
): TrainingRecord {
  return updateTrainingRecord(
    workerApplicationId,
    (record) => {
      const moduleAttempt =
        record.moduleAttempts.find(
          (attempt) =>
            attempt.moduleId === moduleId,
        );

      if (!moduleAttempt) {
        throw new Error(
          "Module attempt not found.",
        );
      }

      if (
        !moduleAttempt.learnerDeclarationAcceptedAt
      ) {
        throw new Error(
          "The learner declaration must be accepted before submission.",
        );
      }

      const assessmentAttempt =
        moduleAttempt.assessmentAttempts.find(
          (attempt) =>
            attempt.id ===
            assessmentAttemptId,
        );

      if (!assessmentAttempt) {
        throw new Error(
          "Assessment attempt not found.",
        );
      }

      if (
        assessmentAttempt.status !==
        "active"
      ) {
        throw new Error(
          "This assessment attempt has already been submitted.",
        );
      }

      const unansweredQuestion =
        assessmentAttempt.questionOrder.find(
          (questionId) =>
            !assessmentAttempt.answers.some(
              (answer) =>
                answer.questionId ===
                questionId,
            ),
        );

      if (unansweredQuestion) {
        throw new Error(
          "Every assessment question must be answered before submission.",
        );
      }

      return {
        ...record,
        moduleAttempts:
          record.moduleAttempts.map(
            (attempt) =>
              attempt.moduleId ===
              moduleId
                ? {
                    ...attempt,
                    status:
                      "human-review",
                    submittedAt:
                      now(),
                    assessmentAttempts:
                      attempt.assessmentAttempts.map(
                        (assessment) =>
                          assessment.id ===
                          assessmentAttemptId
                            ? {
                                ...assessment,
                                status:
                                  "submitted",
                                submittedAt:
                                  now(),
                              }
                            : assessment,
                      ),
                  }
                : attempt,
          ),
        auditEvents: [
          ...record.auditEvents,
          createAuditEvent(
            workerApplicationId,
            moduleId,
            "assessment-submitted",
            "Assessment submitted for AI checks and human review.",
            "learner",
            null,
            assessmentAttemptId,
          ),
          createAuditEvent(
            workerApplicationId,
            moduleId,
            "review-requested",
            "Human review requested after assessment submission.",
            "system",
            null,
            assessmentAttemptId,
          ),
        ],
      };
    },
  );
}

export function addIntegrityFlag(
  workerApplicationId: string,
  moduleId: string,
  flag: IntegrityFlag,
): TrainingRecord {
  return updateTrainingRecord(
    workerApplicationId,
    (record) => ({
      ...record,
      moduleAttempts:
        record.moduleAttempts.map(
          (attempt) =>
            attempt.moduleId ===
            moduleId
              ? {
                  ...attempt,
                  integrityFlags: [
                    ...attempt.integrityFlags,
                    flag,
                  ],
                }
              : attempt,
        ),
      auditEvents: [
        ...record.auditEvents,
        createAuditEvent(
          workerApplicationId,
          moduleId,
          "integrity-flag-created",
          flag.reason,
          "system",
          null,
          flag.moduleAttemptId,
        ),
      ],
    }),
  );
}

export function recordReviewerDecision(
  workerApplicationId: string,
  moduleId: string,
  decision: ReviewerDecision,
): TrainingRecord {
  return updateTrainingRecord(
    workerApplicationId,
    (record) => ({
      ...record,
      moduleAttempts:
        record.moduleAttempts.map(
          (attempt) => {
            if (
              attempt.moduleId !==
              moduleId
            ) {
              return attempt;
            }

            const unresolvedCritical =
              attempt.integrityFlags.some(
                (flag) =>
                  flag.severity ===
                    "critical" &&
                  flag.status !==
                    "resolved",
              );

            if (
              decision.decision ===
                "satisfactory" &&
              unresolvedCritical
            ) {
              throw new Error(
                "Critical integrity flags must be resolved before a satisfactory decision.",
              );
            }

            return {
              ...attempt,
              reviewerDecision:
                decision,
              status:
                decision.decision ===
                "satisfactory"
                  ? "satisfactory"
                  : "not-yet-satisfactory",
              completedAt:
                decision.decision ===
                "satisfactory"
                  ? now()
                  : null,
            };
          },
        ),
      auditEvents: [
        ...record.auditEvents,
        createAuditEvent(
          workerApplicationId,
          moduleId,
          "reviewer-decision-recorded",
          `Reviewer recorded ${decision.decision}.`,
          "reviewer",
          decision.reviewerId,
        ),
        ...(decision.decision ===
        "satisfactory"
          ? [
              createAuditEvent(
                workerApplicationId,
                moduleId,
                "module-completed",
                "Module completed following human review.",
                "system",
              ),
            ]
          : []),
      ],
    }),
  );
}

export function attachExternalEvidenceRecord(
  workerApplicationId: string,
  moduleId: string,
  evidenceRecordId: string,
): TrainingRecord {
  return updateTrainingRecord(
    workerApplicationId,
    (record) => ({
      ...record,
      moduleAttempts:
        record.moduleAttempts.map(
          (attempt) =>
            attempt.moduleId ===
            moduleId &&
            !attempt.externalEvidenceRecordIds.includes(
              evidenceRecordId,
            )
              ? {
                  ...attempt,
                  externalEvidenceRecordIds:
                    [
                      ...attempt.externalEvidenceRecordIds,
                      evidenceRecordId,
                    ],
                }
              : attempt,
        ),
    }),
  );
}