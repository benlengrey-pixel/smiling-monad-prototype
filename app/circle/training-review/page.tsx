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
  readCircleTrainingRequirements,
  subscribeToCircleTraining,
  type CircleTrainingRequirement,
  type ParticipantSpecificTrainingModule,
} from "@/lib/training/circle-modules";
import {
  approveCircleTrainingRequirement,
  requestCircleTrainingChanges,
} from "@/lib/training/circle-progress";

function PageFallback() {
  return (
    <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
          Circle of Support
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Loading Circle training reviews
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
      return "Awaiting your decision";
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

function ParticipantTrainingReviewContent() {
  const searchParams = useSearchParams();

  const circleId =
    searchParams.get("circleId")?.trim() ||
    "primary-circle";

  const [requirements, setRequirements] =
    useState<CircleTrainingRequirement[]>(
      [],
    );

  const [selectedRequirementId, setSelectedRequirementId] =
    useState("");

  const [decisionNote, setDecisionNote] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    const refresh = () => {
      const next =
        readCircleTrainingRequirements()
          .filter(
            (requirement) =>
              requirement.circleId ===
              circleId,
          )
          .sort(
            (left, right) =>
              Date.parse(right.lastUpdatedAt) -
              Date.parse(left.lastUpdatedAt),
          );

      setRequirements(next);

      setSelectedRequirementId(
        (current) =>
          current ||
          next.find(
            (requirement) =>
              requirement.status ===
              "submitted",
          )?.id ||
          next[0]?.id ||
          "",
      );
    };

    refresh();

    return subscribeToCircleTraining(
      refresh,
    );
  }, [circleId]);

  const selectedRequirement = useMemo(
    () =>
      requirements.find(
        (requirement) =>
          requirement.id ===
          selectedRequirementId,
      ) ?? null,
    [
      requirements,
      selectedRequirementId,
    ],
  );

  const selectedModule = useMemo<
    ParticipantSpecificTrainingModule | null
  >(
    () =>
      selectedRequirement
        ? getParticipantSpecificModule(
            selectedRequirement.moduleId,
          )
        : null,
    [selectedRequirement],
  );

  function approveRequirement() {
    if (!selectedRequirement) {
      return;
    }

    try {
      approveCircleTrainingRequirement(
        selectedRequirement.id,
        decisionNote,
      );

      setDecisionNote("");
      setMessage(
        `${selectedRequirement.memberDisplayName} has been approved for the participant-specific Circle module.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to approve this Circle training requirement.",
      );
    }
  }

  function requestChanges() {
    if (!selectedRequirement) {
      return;
    }

    try {
      requestCircleTrainingChanges(
        selectedRequirement.id,
        decisionNote,
      );

      setDecisionNote("");
      setMessage(
        `Changes have been requested from ${selectedRequirement.memberDisplayName}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to request changes.",
      );
    }
  }

  const submittedRequirements =
    requirements.filter(
      (requirement) =>
        requirement.status === "submitted",
    );

  return (
    <main className="min-h-screen bg-[#f4efe5] px-4 py-7 text-[#2c2a26] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
              Circle of Support
            </p>

            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Review mandatory Circle training
            </h1>

            <p className="mt-3 leading-7 text-black/65">
              Review how each worker, provider or
              Circle member understands your
              communication, routines, preferences,
              safety information and expectations
              before they are allowed into your
              Circle.
            </p>
          </div>

          <Link
            href="/circle"
            className="rounded-full border border-black/15 bg-white/70 px-5 py-3 text-sm font-semibold"
          >
            Back to Circle
          </Link>
        </header>

        <section className="mt-7 rounded-[2rem] border border-[#b8c7a8] bg-[#eef3e8] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Waiting for your decision
              </h2>

              <p className="mt-2 text-sm leading-6 text-black/60">
                {submittedRequirements.length} Circle
                member
                {submittedRequirements.length === 1
                  ? ""
                  : "s"}{" "}
                currently awaiting review.
              </p>
            </div>

            <Link
              href={`/circle/my-training?circleId=${encodeURIComponent(
                circleId,
              )}`}
              className="rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
            >
              View my module
            </Link>
          </div>
        </section>

        <div className="mt-7 grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-black/10 bg-white/75 p-4 shadow-sm lg:sticky lg:top-6 lg:self-start">
            <h2 className="px-2 py-2 text-lg font-semibold">
              Circle members
            </h2>

            <div className="mt-3 space-y-2">
              {requirements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/15 p-4 text-sm text-black/50">
                  No mandatory Circle training has
                  been assigned yet.
                </div>
              ) : (
                requirements.map(
                  (requirement) => {
                    const selected =
                      requirement.id ===
                      selectedRequirementId;

                    return (
                      <button
                        key={requirement.id}
                        type="button"
                        onClick={() => {
                          setSelectedRequirementId(
                            requirement.id,
                          );
                          setDecisionNote("");
                          setMessage("");
                        }}
                        className={`w-full rounded-2xl border px-4 py-3 text-left ${
                          selected
                            ? "border-[#596b4d] bg-[#eef3e8]"
                            : "border-black/10 bg-white/60 hover:bg-white"
                        }`}
                      >
                        <p className="font-semibold">
                          {
                            requirement.memberDisplayName
                          }
                        </p>

                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-black/45">
                          {requirement.audience.replaceAll(
                            "-",
                            " ",
                          )}
                        </p>

                        <p className="mt-2 text-xs text-black/50">
                          {statusLabel(
                            requirement.status,
                          )}
                        </p>
                      </button>
                    );
                  },
                )
              )}
            </div>
          </aside>

          <section className="rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm sm:p-8">
            {!selectedRequirement ||
            !selectedModule ? (
              <div className="rounded-3xl border border-dashed border-black/15 p-6 text-black/50">
                Select a Circle member to review
                their training.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-black/45">
                      {
                        selectedModule.title
                      }
                    </p>

                    <h2 className="mt-2 text-3xl font-semibold">
                      {
                        selectedRequirement.memberDisplayName
                      }
                    </h2>

                    <p className="mt-2 text-sm text-black/55">
                      {
                        selectedRequirement.audience
                      }{" "}
                      · Version{" "}
                      {
                        selectedRequirement.moduleVersion
                      }
                    </p>
                  </div>

                  <span className="rounded-full bg-black/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/55">
                    {statusLabel(
                      selectedRequirement.status,
                    )}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-black/10 bg-white/70 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                      Knowledge score
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {selectedRequirement.knowledgeScore ??
                        "Pending"}
                      {selectedRequirement.knowledgeScore !==
                      null
                        ? "%"
                        : ""}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-black/10 bg-white/70 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                      Critical questions
                    </p>

                    <p className="mt-2 text-lg font-semibold">
                      {selectedRequirement.criticalQuestionsPassed
                        ? "Passed"
                        : "Not yet passed"}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-black/10 bg-white/70 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                      Acknowledgement
                    </p>

                    <p className="mt-2 text-lg font-semibold">
                      {selectedRequirement.learnerAcknowledgementAcceptedAt
                        ? "Accepted"
                        : "Not accepted"}
                    </p>
                  </div>
                </div>

                <div className="mt-7 space-y-5">
                  {selectedModule.questions.map(
                    (question) => {
                      const response =
                        selectedRequirement.assessmentResponses.find(
                          (item) =>
                            item.questionId ===
                            question.id,
                        );

                      return (
                        <article
                          key={question.id}
                          className="rounded-3xl border border-black/10 bg-white/70 p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold">
                              Question{" "}
                              {question.order}
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

                          {response?.selectedOptionIds.length ? (
                            <div className="mt-4 rounded-2xl bg-[#f7f3eb] px-4 py-3 text-sm text-black/65">
                              Selected:{" "}
                              {response.selectedOptionIds
                                .map((optionId) =>
                                  question.options.find(
                                    (option) =>
                                      option.id ===
                                      optionId,
                                  )?.label ??
                                  optionId,
                                )
                                .join(", ")}
                            </div>
                          ) : null}

                          {response?.response ? (
                            <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#f7f3eb] px-4 py-4 leading-7 text-black/70">
                              {response.response}
                            </p>
                          ) : (
                            <p className="mt-4 text-sm text-black/40">
                              No written response recorded.
                            </p>
                          )}
                        </article>
                      );
                    },
                  )}
                </div>

                {selectedRequirement.status ===
                "submitted" ? (
                  <div className="mt-7 rounded-3xl border border-black/10 bg-[#f7f3eb] p-5">
                    <h3 className="text-lg font-semibold">
                      Your decision
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-black/55">
                      Approve only when you are
                      confident this person
                      understands your module.
                    </p>

                    <textarea
                      value={decisionNote}
                      onChange={(event) =>
                        setDecisionNote(
                          event.target.value,
                        )
                      }
                      rows={4}
                      className="mt-4 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                      placeholder="Add an approval note or explain what needs to change."
                    />

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={
                          approveRequirement
                        }
                        className="rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
                      >
                        Approve completion
                      </button>

                      <button
                        type="button"
                        onClick={requestChanges}
                        className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-semibold"
                      >
                        Request changes
                      </button>
                    </div>
                  </div>
                ) : null}

                {selectedRequirement.participantDecisionNote ? (
                  <div className="mt-6 rounded-3xl border border-black/10 bg-white/70 p-5">
                    <h3 className="font-semibold">
                      Participant decision note
                    </h3>

                    <p className="mt-2 leading-7 text-black/65">
                      {
                        selectedRequirement.participantDecisionNote
                      }
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>

        {message ? (
          <p className="mt-6 rounded-2xl bg-black/5 px-4 py-3 text-sm">
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}

export default function ParticipantTrainingReviewPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <ParticipantTrainingReviewContent />
    </Suspense>
  );
}