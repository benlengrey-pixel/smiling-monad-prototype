"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createAssessmentAnswer,
  createAssessmentQuestionSet,
  validateAssessmentSubmission,
} from "@/lib/training/assessment-engine";
import {
  moduleOneAssessmentSelection,
  moduleOneRightsAndWorkerRole,
} from "@/lib/training/module-1";
import {
  acceptLearnerDeclaration,
  readTrainingRecord,
  recordAssessmentAnswer,
  startAssessmentAttempt,
  submitAssessmentAttempt,
  subscribeToTrainingRecords,
} from "@/lib/training/progress-client";
import type {
  AssessmentAnswer,
  AssessmentAttempt,
  AssessmentQuestion,
  TrainingRecord,
  WorkerModuleAttempt,
} from "@/lib/training/types";

function AssessmentFallback() {
  return (
    <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
          Smiling Monad School
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Loading Module 1 assessment
        </h1>

        <p className="mt-4 leading-7 text-black/70">
          Opening the worker&apos;s protected assessment record.
        </p>
      </div>
    </main>
  );
}

function getModuleAttempt(
  record: TrainingRecord | null,
): WorkerModuleAttempt | null {
  return (
    record?.moduleAttempts.find(
      (attempt) =>
        attempt.moduleId ===
        moduleOneRightsAndWorkerRole.id,
    ) ?? null
  );
}

function getActiveOrLatestAttempt(
  moduleAttempt: WorkerModuleAttempt | null,
): AssessmentAttempt | null {
  if (!moduleAttempt) {
    return null;
  }

  const active =
    moduleAttempt.assessmentAttempts.find(
      (attempt) =>
        attempt.status === "active",
    );

  if (active) {
    return active;
  }

  return (
    moduleAttempt.assessmentAttempts[
      moduleAttempt.assessmentAttempts.length - 1
    ] ?? null
  );
}

function allLearningSectionsComplete(
  moduleAttempt: WorkerModuleAttempt | null,
): boolean {
  if (!moduleAttempt) {
    return false;
  }

  return moduleOneRightsAndWorkerRole.sections
    .filter((section) => section.required)
    .every(
      (section) =>
        moduleAttempt.sectionProgress.find(
          (progress) =>
            progress.sectionId ===
            section.id,
        )?.status === "completed",
    );
}

function getQuestion(
  questionId: string,
): AssessmentQuestion | null {
  return (
    moduleOneRightsAndWorkerRole.questionBank.find(
      (question) =>
        question.id === questionId,
    ) ?? null
  );
}

function AssessmentContent() {
  const searchParams = useSearchParams();
  const workerApplicationId =
    searchParams.get("applicationId")?.trim() ??
    "";

  const [record, setRecord] =
    useState<TrainingRecord | null>(null);
  const [message, setMessage] =
    useState("");
  const [questionStartedAt, setQuestionStartedAt] =
    useState<Record<string, string>>({});

  useEffect(() => {
    if (!workerApplicationId) {
      setRecord(null);
      return;
    }

    const refresh = () => {
      setRecord(
        readTrainingRecord(
          workerApplicationId,
        ),
      );
    };

    refresh();

    return subscribeToTrainingRecords(
      refresh,
    );
  }, [workerApplicationId]);

  const moduleAttempt = useMemo(
    () => getModuleAttempt(record),
    [record],
  );

  const assessmentAttempt = useMemo(
    () =>
      getActiveOrLatestAttempt(
        moduleAttempt,
      ),
    [moduleAttempt],
  );

  const questions = useMemo(
    () =>
      assessmentAttempt?.questionOrder
        .map(getQuestion)
        .filter(
          (
            question,
          ): question is AssessmentQuestion =>
            Boolean(question),
        ) ?? [],
    [assessmentAttempt],
  );

  const answersByQuestionId = useMemo(
    () =>
      new Map(
        assessmentAttempt?.answers.map(
          (answer) => [
            answer.questionId,
            answer,
          ],
        ) ?? [],
      ),
    [assessmentAttempt],
  );

  function beginAssessment() {
    if (
      !workerApplicationId ||
      !moduleAttempt
    ) {
      return;
    }

    try {
      const selection =
        createAssessmentQuestionSet(
          moduleOneRightsAndWorkerRole,
          moduleOneAssessmentSelection,
        );

      startAssessmentAttempt(
        workerApplicationId,
        moduleOneRightsAndWorkerRole,
        selection.questionIds,
      );

      setMessage(
        "Assessment started. Your answers are saved as you work.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start the assessment.",
      );
    }
  }

  function getStartedAt(
    questionId: string,
  ): string {
    const existing =
      questionStartedAt[questionId];

    if (existing) {
      return existing;
    }

    const created =
      new Date().toISOString();

    setQuestionStartedAt((current) => ({
      ...current,
      [questionId]: created,
    }));

    return created;
  }

  function saveAnswer(
    question: AssessmentQuestion,
    response: string,
    selectedOptionIds: string[],
  ) {
    if (
      !workerApplicationId ||
      !assessmentAttempt ||
      assessmentAttempt.status !== "active"
    ) {
      return;
    }

    const existing =
      answersByQuestionId.get(
        question.id,
      );

    const answer =
      createAssessmentAnswer(
        question,
        response,
        selectedOptionIds,
        existing?.startedAt ??
          getStartedAt(question.id),
        false,
      );

    recordAssessmentAnswer(
      workerApplicationId,
      moduleOneRightsAndWorkerRole.id,
      assessmentAttempt.id,
      answer,
    );
  }

  function updateWrittenAnswer(
    question: AssessmentQuestion,
    response: string,
  ) {
    const existing =
      answersByQuestionId.get(
        question.id,
      );

    saveAnswer(
      question,
      response,
      existing?.selectedOptionIds ?? [],
    );
  }

  function updateSingleOption(
    question: AssessmentQuestion,
    optionId: string,
  ) {
    saveAnswer(
      question,
      "",
      [optionId],
    );
  }

  function updateMultipleOption(
    question: AssessmentQuestion,
    optionId: string,
    checked: boolean,
  ) {
    const existing =
      answersByQuestionId.get(
        question.id,
      );

    const current =
      existing?.selectedOptionIds ?? [];

    const next = checked
      ? [...new Set([...current, optionId])]
      : current.filter(
          (id) => id !== optionId,
        );

    saveAnswer(
      question,
      "",
      next,
    );
  }

  function updateDeclaration(
    checked: boolean,
  ) {
    if (
      !checked ||
      !workerApplicationId
    ) {
      return;
    }

    acceptLearnerDeclaration(
      workerApplicationId,
      moduleOneRightsAndWorkerRole.id,
    );

    setMessage(
      "Learner declaration accepted.",
    );
  }

  function submitAssessment() {
    if (
      !workerApplicationId ||
      !assessmentAttempt ||
      !moduleAttempt
    ) {
      return;
    }

    const check =
      validateAssessmentSubmission(
        moduleOneRightsAndWorkerRole,
        assessmentAttempt,
        Boolean(
          moduleAttempt.learnerDeclarationAcceptedAt,
        ),
      );

    if (!check.valid) {
      setMessage(check.errors[0]);
      return;
    }

    try {
      submitAssessmentAttempt(
        workerApplicationId,
        moduleOneRightsAndWorkerRole.id,
        assessmentAttempt.id,
      );

      setMessage(
        "Assessment submitted. Your original answers are now locked and ready for AI checks and human review.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit the assessment.",
      );
    }
  }

  if (
    !workerApplicationId ||
    !record ||
    !moduleAttempt
  ) {
    return (
      <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
            Smiling Monad School
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Module 1 assessment
          </h1>

          <p className="mt-4 leading-7 text-black/70">
            Open this assessment from an active worker training record.
          </p>

          <Link
            href={
              workerApplicationId
                ? `/school/workers/training?applicationId=${encodeURIComponent(
                    workerApplicationId,
                  )}`
                : "/school"
            }
            className="mt-7 inline-flex rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
          >
            Return to training
          </Link>
        </div>
      </main>
    );
  }

  const learningComplete =
    allLearningSectionsComplete(
      moduleAttempt,
    );

  const assessmentLocked =
    assessmentAttempt &&
    assessmentAttempt.status !== "active";

  return (
    <main className="min-h-screen bg-[#f4efe5] px-4 py-6 text-[#2c2a26] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
              {moduleOneRightsAndWorkerRole.code} · Assessment
            </p>

            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Rights, Responsibilities and the NDIS Worker Role
            </h1>

            <p className="mt-3 leading-7 text-black/65">
              Complete every question in your own words. Critical safety questions must be answered correctly and all submitted answers remain in the evidence record.
            </p>
          </div>

          <Link
            href={`/school/workers/training/${moduleOneRightsAndWorkerRole.id}?applicationId=${encodeURIComponent(
              workerApplicationId,
            )}`}
            className="rounded-full border border-black/15 bg-white/70 px-5 py-3 text-sm font-semibold"
          >
            Back to learning
          </Link>
        </header>

        {!learningComplete ? (
          <section className="mt-7 rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-semibold">
              Assessment locked
            </h2>

            <p className="mt-2 leading-7 text-black/65">
              Complete all six required learning sections before starting the assessment.
            </p>
          </section>
        ) : null}

        {learningComplete &&
        !assessmentAttempt ? (
          <section className="mt-7 rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              Before you begin
            </h2>

            <p className="mt-3 leading-7 text-black/65">
              The assessment uses a randomised set of knowledge, critical safety, scenario and reflection questions. You may complete two attempts before reviewer intervention is required.
            </p>

            <button
              type="button"
              onClick={beginAssessment}
              className="mt-6 rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
            >
              Start assessment
            </button>
          </section>
        ) : null}

        {assessmentLocked ? (
          <section className="mt-7 rounded-[2rem] border border-[#b8c7a8] bg-[#eef3e8] p-6">
            <h2 className="text-2xl font-semibold">
              Assessment submitted
            </h2>

            <p className="mt-3 leading-7 text-black/65">
              Your answers are locked. The assessment now requires automated checks and an authorised human reviewer decision.
            </p>

            <p className="mt-3 text-sm text-black/55">
              Attempt {assessmentAttempt.attemptNumber} · Status:{" "}
              {assessmentAttempt.status}
            </p>
          </section>
        ) : null}

        {assessmentAttempt?.status ===
        "active" ? (
          <>
            <div className="mt-7 space-y-6">
              {questions.map(
                (question, index) => {
                  const answer =
                    answersByQuestionId.get(
                      question.id,
                    );

                  const written =
                    answer?.response ?? "";

                  return (
                    <section
                      key={question.id}
                      className="rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm sm:p-8"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-black/45">
                          Question {index + 1} of{" "}
                          {questions.length}
                        </p>

                        {question.critical ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                            Critical safety question
                          </span>
                        ) : null}
                      </div>

                      <h2 className="mt-4 text-xl font-semibold leading-8">
                        {question.prompt}
                      </h2>

                      {question.options?.length ? (
                        <div className="mt-5 space-y-3">
                          {question.options.map(
                            (option) => {
                              const selected =
                                answer?.selectedOptionIds.includes(
                                  option.id,
                                ) ?? false;

                              const multiple =
                                question.type ===
                                "multiple-select";

                              return (
                                <label
                                  key={option.id}
                                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3"
                                >
                                  <input
                                    type={
                                      multiple
                                        ? "checkbox"
                                        : "radio"
                                    }
                                    name={question.id}
                                    checked={selected}
                                    onChange={(
                                      event,
                                    ) => {
                                      if (multiple) {
                                        updateMultipleOption(
                                          question,
                                          option.id,
                                          event.target
                                            .checked,
                                        );
                                      } else {
                                        updateSingleOption(
                                          question,
                                          option.id,
                                        );
                                      }
                                    }}
                                    className="mt-1"
                                  />

                                  <span className="leading-6 text-black/70">
                                    {option.label}
                                  </span>
                                </label>
                              );
                            },
                          )}
                        </div>
                      ) : null}

                      {[
                        "short-answer",
                        "scenario",
                        "reflection",
                      ].includes(
                        question.type,
                      ) ? (
                        <div className="mt-5">
                          <textarea
                            value={written}
                            onChange={(event) =>
                              updateWrittenAnswer(
                                question,
                                event.target.value,
                              )
                            }
                            rows={
                              question.type ===
                              "reflection"
                                ? 8
                                : 6
                            }
                            className="w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                            placeholder="Write your answer in your own words."
                          />

                          {question.minimumResponseLength ? (
                            <p className="mt-2 text-sm text-black/45">
                              {written.length} / minimum{" "}
                              {
                                question.minimumResponseLength
                              }{" "}
                              characters
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </section>
                  );
                },
              )}
            </div>

            <section className="mt-7 rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-semibold">
                Learner declaration
              </h2>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 bg-white px-4 py-4">
                <input
                  type="checkbox"
                  checked={Boolean(
                    moduleAttempt.learnerDeclarationAcceptedAt,
                  )}
                  onChange={(event) =>
                    updateDeclaration(
                      event.target.checked,
                    )
                  }
                  className="mt-1"
                />

                <span className="leading-7 text-black/70">
                  I confirm that these responses are my own. I have identified any assistance or reasonable adjustment I received. I understand that false information may lead to reassessment, suspension or removal from the program.
                </span>
              </label>

              <button
                type="button"
                onClick={submitAssessment}
                className="mt-6 rounded-full bg-[#2c2a26] px-6 py-3 text-sm font-semibold text-white"
              >
                Submit assessment for review
              </button>
            </section>
          </>
        ) : null}

        {message ? (
          <p className="mt-6 rounded-2xl bg-black/5 px-4 py-3 text-sm">
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}

export default function ModuleAssessmentPage() {
  return (
    <Suspense fallback={<AssessmentFallback />}>
      <AssessmentContent />
    </Suspense>
  );
}