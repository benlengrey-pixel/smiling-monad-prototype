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
  getParticipantSpecificModule,
  subscribeToCircleTraining,
  type CircleTrainingAssessmentResponse,
  type CircleTrainingQuestion,
} from "@/lib/training/circle-modules";
import {
  acceptCircleTrainingAcknowledgement,
  getCircleTrainingRequirement,
  recordCircleTrainingResponse,
  startCircleTrainingRequirement,
  submitCircleTrainingRequirement,
} from "@/lib/training/circle-progress";
import type {
  CircleTrainingRequirement,
  ParticipantSpecificTrainingModule,
} from "@/lib/training/circle-modules";

function PageFallback() {
  return (
    <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
          Circle of Support
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Loading mandatory Circle training
        </h1>
      </div>
    </main>
  );
}

function statusLabel(
  status: CircleTrainingRequirement["status"],
): string {
  switch (status) {
    case "required":
      return "Required";
    case "in-progress":
      return "In progress";
    case "submitted":
      return "Awaiting approval";
    case "changes-requested":
      return "Changes requested";
    case "completed":
      return "Completed";
    case "waived":
      return "Waived";
    case "expired":
      return "Expired";
    case "removed":
      return "Removed";
    default:
      return status;
  }
}

function contentBlockClass(
  type: string,
): string {
  switch (type) {
    case "participant-message":
      return "border-sky-200 bg-sky-50";
    case "communication":
      return "border-violet-200 bg-violet-50";
    case "routine":
      return "border-amber-200 bg-amber-50";
    case "preference":
      return "border-emerald-200 bg-emerald-50";
    case "safety":
      return "border-rose-200 bg-rose-50";
    case "boundary":
      return "border-slate-200 bg-slate-50";
    default:
      return "border-black/10 bg-white/70";
  }
}

function makeResponse(
  question: CircleTrainingQuestion,
  response: string,
  selectedOptionIds: string[],
  existing?: CircleTrainingAssessmentResponse,
): CircleTrainingAssessmentResponse {
  return {
    questionId: question.id,
    response,
    selectedOptionIds,
    startedAt:
      existing?.startedAt ??
      new Date().toISOString(),
    answeredAt: new Date().toISOString(),
  };
}

function CircleMemberTrainingContent() {
  const searchParams = useSearchParams();

  const requirementId =
    searchParams.get("requirementId")?.trim() ??
    "";

  const [requirement, setRequirement] =
    useState<CircleTrainingRequirement | null>(
      null,
    );

  const [module, setModule] =
    useState<ParticipantSpecificTrainingModule | null>(
      null,
    );

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    if (!requirementId) {
      setRequirement(null);
      setModule(null);
      return;
    }

    const refresh = () => {
      const nextRequirement =
        getCircleTrainingRequirement(
          requirementId,
        );

      setRequirement(nextRequirement);

      setModule(
        nextRequirement
          ? getParticipantSpecificModule(
              nextRequirement.moduleId,
            )
          : null,
      );
    };

    refresh();

    return subscribeToCircleTraining(
      refresh,
    );
  }, [requirementId]);

  const responsesByQuestionId = useMemo(
    () =>
      new Map(
        requirement?.assessmentResponses.map(
          (response) => [
            response.questionId,
            response,
          ],
        ) ?? [],
      ),
    [requirement],
  );

  function beginModule() {
    if (!requirement) {
      return;
    }

    try {
      startCircleTrainingRequirement(
        requirement.id,
      );

      setMessage(
        "Mandatory Circle training started.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start the module.",
      );
    }
  }

  function saveWrittenResponse(
    question: CircleTrainingQuestion,
    response: string,
  ) {
    if (
      !requirement ||
      requirement.status !== "in-progress"
    ) {
      return;
    }

    const existing =
      responsesByQuestionId.get(
        question.id,
      );

    recordCircleTrainingResponse(
      requirement.id,
      makeResponse(
        question,
        response,
        existing?.selectedOptionIds ?? [],
        existing,
      ),
    );
  }

  function saveSingleOption(
    question: CircleTrainingQuestion,
    optionId: string,
  ) {
    if (
      !requirement ||
      requirement.status !== "in-progress"
    ) {
      return;
    }

    const existing =
      responsesByQuestionId.get(
        question.id,
      );

    recordCircleTrainingResponse(
      requirement.id,
      makeResponse(
        question,
        existing?.response ?? "",
        [optionId],
        existing,
      ),
    );
  }

  function acceptAcknowledgement(
    checked: boolean,
  ) {
    if (
      !checked ||
      !requirement
    ) {
      return;
    }

    try {
      acceptCircleTrainingAcknowledgement(
        requirement.id,
      );

      setMessage(
        "Acknowledgement accepted.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to record the acknowledgement.",
      );
    }
  }

  function submitModule() {
    if (!requirement) {
      return;
    }

    try {
      submitCircleTrainingRequirement(
        requirement.id,
      );

      setMessage(
        "Your responses have been submitted for participant approval.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit the module.",
      );
    }
  }

  if (
    !requirementId ||
    !requirement ||
    !module
  ) {
    return (
      <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
            Circle of Support
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Mandatory Circle training
          </h1>

          <p className="mt-4 leading-7 text-black/70">
            Open this page from your Circle
            invitation or member record so the
            required participant-specific module
            can be matched to you.
          </p>

          <Link
            href="/circle"
            className="mt-7 inline-flex rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
          >
            Return to Circle
          </Link>
        </div>
      </main>
    );
  }

  const canEdit = [
    "required",
    "in-progress",
    "changes-requested",
  ].includes(requirement.status);

  const submitted =
    requirement.status === "submitted";

  const completed =
    requirement.status === "completed";

  return (
    <main className="min-h-screen bg-[#f4efe5] px-4 py-7 text-[#2c2a26] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
              Mandatory Circle module
            </p>

            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              {module.title}
            </h1>

            <p className="mt-3 leading-7 text-black/65">
              {module.purpose}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#eef3e8] px-4 py-2 text-xs font-semibold text-[#34452d]">
              {statusLabel(
                requirement.status,
              )}
            </span>

            <Link
              href="/circle"
              className="rounded-full border border-black/15 bg-white/70 px-5 py-3 text-sm font-semibold"
            >
              Back to Circle
            </Link>
          </div>
        </header>

        <section className="mt-7 rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-black/45">
            Created by{" "}
            {module.participantDisplayName}
          </p>

          <p className="mt-3 leading-7 text-black/65">
            Every person included in the selected
            Circle roles must complete this module
            before joining the Circle. This
            requirement is separate from the main
            Smiling Monad worker training package.
          </p>

          {requirement.status === "required" ? (
            <button
              type="button"
              onClick={beginModule}
              className="mt-6 rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
            >
              Begin mandatory module
            </button>
          ) : null}

          {requirement.status ===
          "changes-requested" ? (
            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="font-semibold">
                Changes requested
              </h2>

              <p className="mt-2 leading-7 text-black/65">
                {
                  requirement.participantDecisionNote
                }
              </p>

              <button
                type="button"
                onClick={beginModule}
                className="mt-4 rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
              >
                Continue module
              </button>
            </div>
          ) : null}
        </section>

        <div className="mt-7 space-y-5">
          {module.contentBlocks.map(
            (block) => (
              <article
                key={block.id}
                className={`rounded-[2rem] border p-6 shadow-sm sm:p-8 ${contentBlockClass(
                  block.type,
                )}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/45">
                  {block.type.replaceAll(
                    "-",
                    " ",
                  )}
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  {block.title}
                </h2>

                <p className="mt-4 whitespace-pre-wrap leading-7 text-black/70">
                  {block.content}
                </p>

                {block.items.length > 0 ? (
                  <ul className="mt-4 space-y-2 pl-5 text-black/70">
                    {block.items.map((item) => (
                      <li
                        key={item}
                        className="list-disc leading-6"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ),
          )}
        </div>

        {canEdit &&
        requirement.status !== "required" ? (
          <section className="mt-7 rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              Check your understanding
            </h2>

            <p className="mt-2 leading-7 text-black/60">
              Complete every response in your own
              words. The participant may ask you
              to clarify or revise your answers.
            </p>

            <div className="mt-6 space-y-6">
              {module.questions.map(
                (question) => {
                  const response =
                    responsesByQuestionId.get(
                      question.id,
                    );

                  return (
                    <article
                      key={question.id}
                      className="rounded-3xl border border-black/10 bg-white/70 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold">
                          Question {question.order}
                        </p>

                        {question.critical ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                            Required understanding
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-lg font-semibold leading-7">
                        {question.prompt}
                      </h3>

                      {question.options.length >
                      0 ? (
                        <div className="mt-4 space-y-3">
                          {question.options.map(
                            (option) => (
                              <label
                                key={option.id}
                                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3"
                              >
                                <input
                                  type="radio"
                                  name={
                                    question.id
                                  }
                                  checked={
                                    response?.selectedOptionIds.includes(
                                      option.id,
                                    ) ?? false
                                  }
                                  onChange={() =>
                                    saveSingleOption(
                                      question,
                                      option.id,
                                    )
                                  }
                                  className="mt-1"
                                />

                                <span className="leading-6 text-black/70">
                                  {option.label}
                                </span>
                              </label>
                            ),
                          )}
                        </div>
                      ) : null}

                      {question.minimumResponseLength >
                      0 ? (
                        <div className="mt-4">
                          <textarea
                            value={
                              response?.response ??
                              ""
                            }
                            onChange={(event) =>
                              saveWrittenResponse(
                                question,
                                event.target
                                  .value,
                              )
                            }
                            rows={
                              question.type ===
                              "reflection"
                                ? 7
                                : 5
                            }
                            className="w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                            placeholder="Write your response in your own words."
                          />

                          <p className="mt-2 text-sm text-black/45">
                            {response?.response
                              .length ?? 0}{" "}
                            / minimum{" "}
                            {
                              question.minimumResponseLength
                            }{" "}
                            characters
                          </p>
                        </div>
                      ) : null}
                    </article>
                  );
                },
              )}
            </div>

            <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-3xl border border-black/10 bg-[#f7f3eb] p-5">
              <input
                type="checkbox"
                checked={Boolean(
                  requirement.learnerAcknowledgementAcceptedAt,
                )}
                onChange={(event) =>
                  acceptAcknowledgement(
                    event.target.checked,
                  )
                }
                className="mt-1"
              />

              <span className="leading-7 text-black/70">
                I confirm that I have read and
                understood the participant’s
                communication, routines,
                preferences, safety information
                and Circle expectations. I will ask
                when I am uncertain rather than
                making assumptions.
              </span>
            </label>

            <button
              type="button"
              onClick={submitModule}
              className="mt-6 rounded-full bg-[#2c2a26] px-6 py-3 text-sm font-semibold text-white"
            >
              Submit to participant
            </button>
          </section>
        ) : null}

        {submitted ? (
          <section className="mt-7 rounded-[2rem] border border-[#b8c7a8] bg-[#eef3e8] p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">
              Submitted to the participant
            </h2>

            <p className="mt-3 leading-7 text-black/65">
              Your responses are awaiting the
              participant’s approval
              {module.humanReviewRequired
                ? " and an additional reviewer decision."
                : "."}
            </p>
          </section>
        ) : null}

        {completed ? (
          <section className="mt-7 rounded-[2rem] border border-[#b8c7a8] bg-[#eef3e8] p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">
              Mandatory Circle training complete
            </h2>

            <p className="mt-3 leading-7 text-black/65">
              You have completed the
              participant-specific requirement
              for this Circle.
            </p>

            {requirement.expiresAt ? (
              <p className="mt-3 text-sm text-black/50">
                Renewal due{" "}
                {new Date(
                  requirement.expiresAt,
                ).toLocaleDateString()}
              </p>
            ) : null}
          </section>
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

export default function CircleMemberTrainingPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <CircleMemberTrainingContent />
    </Suspense>
  );
}