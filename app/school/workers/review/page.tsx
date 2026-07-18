"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createApprovedWorkerConnectionProfile,
  isWorkerEligibleForApproval,
  isWorkerEvidenceReady,
  isWorkerProfileReady,
  isWorkerTrainingComplete,
  readSmilingMonadState,
  subscribeToSmilingMonadState,
  updateWorkerApplication,
  type WorkerApplication,
  type WorkerBadgeStatus,
  type WorkerEvidenceStatus,
} from "@/lib/platform/smiling-monad-state";

type ReviewFilter =
  | "submitted"
  | "changes"
  | "approved"
  | "all";

function addMonths(
  date: Date,
  months: number,
): string {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);

  return next.toISOString();
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(
    "en-AU",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(value));
}

function statusLabel(
  status: WorkerApplication["status"],
): string {
  return status
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

export default function WorkerReviewPage() {
  const [applications, setApplications] =
    useState<WorkerApplication[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [activeId, setActiveId] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState<ReviewFilter>("submitted");

  const [reviewNote, setReviewNote] =
    useState("");

  useEffect(() => {
    const state =
      readSmilingMonadState();

    setApplications(
      state.workerApplications,
    );

    const firstSubmitted =
      state.workerApplications.find(
        (application) =>
          application.status ===
            "profile-review" ||
          application.status ===
            "evidence-review",
      );

    setActiveId(
      firstSubmitted?.id ??
        state.workerApplications[0]?.id ??
        null,
    );

    setLoaded(true);

    return subscribeToSmilingMonadState(
      (nextState) => {
        setApplications(
          nextState.workerApplications,
        );
      },
    );
  }, []);

  const visibleApplications = useMemo(
    () =>
      applications.filter(
        (application) => {
          if (filter === "all") {
            return true;
          }

          if (filter === "submitted") {
            return (
              application.status ===
                "profile-review" ||
              application.status ===
                "evidence-review"
            );
          }

          if (filter === "changes") {
            return (
              application.status ===
              "changes-requested"
            );
          }

          return (
            application.status ===
            "approved"
          );
        },
      ),
    [applications, filter],
  );

  const activeApplication = useMemo(
    () =>
      applications.find(
        (application) =>
          application.id === activeId,
      ) ?? null,
    [applications, activeId],
  );

  const trainingReady =
    activeApplication
      ? isWorkerTrainingComplete(
          activeApplication,
        )
      : false;

  const evidenceReady =
    activeApplication
      ? isWorkerEvidenceReady(
          activeApplication,
        )
      : false;

  const profileReady =
    activeApplication
      ? isWorkerProfileReady(
          activeApplication,
        )
      : false;

  const approvalReady =
    activeApplication
      ? isWorkerEligibleForApproval(
          activeApplication,
        )
      : false;

  function addReviewNote(
    application: WorkerApplication,
  ): string[] {
    const note = reviewNote.trim();

    return note
      ? [
          ...application.reviewNotes,
          `${new Date().toLocaleDateString(
            "en-AU",
          )}: ${note}`,
        ]
      : application.reviewNotes;
  }

  function requestChanges() {
    if (!activeApplication) {
      return;
    }

    updateWorkerApplication(
      activeApplication.id,
      (application) => ({
        ...application,
        status: "changes-requested",
        badgeStatus: "not-eligible",
        reviewNotes:
          addReviewNote(application),
      }),
    );

    setReviewNote("");
  }

  function approveApplication() {
    if (
      !activeApplication ||
      !approvalReady
    ) {
      return;
    }

    const reviewedAt =
      new Date().toISOString();

    updateWorkerApplication(
      activeApplication.id,
      (application) => ({
        ...application,
        status: "approved",
        badgeStatus: "active",
        approvedAt:
          application.approvedAt ??
          reviewedAt,
        lastReviewedAt: reviewedAt,
        renewalDueAt: addMonths(
          new Date(reviewedAt),
          12,
        ),
        reviewNotes:
          addReviewNote(application),
      }),
    );

    setReviewNote("");

    const refreshed =
      readSmilingMonadState()
        .workerApplications.find(
          (application) =>
            application.id ===
            activeApplication.id,
        );

    if (
      refreshed &&
      !refreshed.connectionProfileId
    ) {
      createApprovedWorkerConnectionProfile(
        refreshed.id,
      );
    }
  }

  function suspendApplication() {
    if (!activeApplication) {
      return;
    }

    const badgeStatus: WorkerBadgeStatus =
      "suspended";

    updateWorkerApplication(
      activeApplication.id,
      (application) => ({
        ...application,
        status: "suspended",
        badgeStatus,
        reviewNotes:
          addReviewNote(application),
      }),
    );

    setReviewNote("");
  }

  function verifyEvidence(
    evidenceId: string,
    status: WorkerEvidenceStatus,
  ) {
    if (!activeApplication) {
      return;
    }

    const verifiedAt =
      status === "verified"
        ? new Date().toISOString()
        : null;

    updateWorkerApplication(
      activeApplication.id,
      (application) => ({
        ...application,
        evidence:
          application.evidence.map(
            (record) =>
              record.id === evidenceId
                ? {
                    ...record,
                    status,
                    verifiedAt,
                  }
                : record,
          ),
      }),
    );
  }

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#e8eee5_0%,#f7f0e5_55%,#e9d4b8_100%)] px-4 pb-12 pt-5 text-[#40352c] sm:px-8 sm:pt-8">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <Link
          href="/school"
          aria-label="Return to the Smiling Monad School"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#7c6a58]/25 bg-white/80 text-xl shadow-sm"
        >
          ←
        </Link>

        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#7d715f] sm:text-xs">
            Authorised review area
          </p>

          <h1 className="mt-1 font-serif text-2xl sm:text-4xl">
            Worker Review
          </h1>
        </div>

        <Link
          href="/office"
          className="rounded-full border border-[#7c6a58]/25 bg-white/80 px-4 py-2 text-sm shadow-sm"
        >
          Space
        </Link>
      </header>

      <section className="mx-auto mt-8 grid w-full max-w-7xl gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-[28px] border border-white/70 bg-white/65 p-4 shadow-[0_20px_60px_rgba(70,50,35,0.12)] backdrop-blur-xl">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["submitted", "Submitted"],
                ["changes", "Changes"],
                ["approved", "Approved"],
                ["all", "All"],
              ] as Array<
                [ReviewFilter, string]
              >
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setFilter(value)
                }
                className={`rounded-full px-3 py-2 text-sm ${
                  filter === value
                    ? "bg-[#60432f] text-white"
                    : "bg-[#efe3d2] text-[#60432f]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {!loaded ? (
              <p className="rounded-[18px] bg-[#f4eadc] p-4">
                Loading applications…
              </p>
            ) : visibleApplications.length ===
              0 ? (
              <p className="rounded-[18px] border border-dashed border-[#ccb99f] bg-[#f4eadc] p-4 text-sm leading-6 text-[#725f4f]">
                No applications match this
                view.
              </p>
            ) : (
              visibleApplications.map(
                (application) => (
                  <button
                    key={application.id}
                    type="button"
                    onClick={() =>
                      setActiveId(
                        application.id,
                      )
                    }
                    className={`w-full rounded-[18px] border p-4 text-left transition ${
                      activeId ===
                      application.id
                        ? "border-[#60432f] bg-[#eee0ce]"
                        : "border-[#ddcfbc] bg-white hover:bg-[#f8f1e7]"
                    }`}
                  >
                    <p className="font-serif text-lg">
                      {application
                        .publicProfile
                        .displayName ||
                        application
                          .privateDetails
                          .legalName ||
                        "Unnamed worker"}
                    </p>

                    <p className="mt-1 text-sm text-[#756151]">
                      {statusLabel(
                        application.status,
                      )}
                    </p>
                  </button>
                ),
              )
            )}
          </div>
        </aside>

        <section className="rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_60px_rgba(70,50,35,0.12)] backdrop-blur-xl sm:p-8">
          {!activeApplication ? (
            <div className="rounded-[22px] border border-dashed border-[#ccb99f] bg-[#f4eadc] p-8 text-center">
              Select a worker application to
              begin review.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 border-b border-[#dfd1bd] pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#846e58]">
                    Private application
                  </p>

                  <h2 className="mt-2 font-serif text-3xl">
                    {activeApplication
                      .publicProfile
                      .displayName ||
                      activeApplication
                        .privateDetails
                        .legalName ||
                      "Worker application"}
                  </h2>

                  <p className="mt-2 text-[#6d5e50]">
                    Status:{" "}
                    {statusLabel(
                      activeApplication.status,
                    )}
                  </p>
                </div>

                <div className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm font-medium text-[#60432f]">
                  Badge:{" "}
                  {activeApplication.badgeStatus}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Training",
                    ready: trainingReady,
                  },
                  {
                    label: "Evidence",
                    ready: evidenceReady,
                  },
                  {
                    label: "Public profile",
                    ready: profileReady,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[18px] border border-[#ddcfbd] bg-[#f4eadc] p-4"
                  >
                    <p className="text-sm text-[#756151]">
                      {item.label}
                    </p>

                    <p className="mt-2 font-serif text-xl">
                      {item.ready
                        ? "Ready"
                        : "Incomplete"}
                    </p>
                  </div>
                ))}
              </div>

              <section className="mt-7 rounded-[22px] border border-[#ddcfbd] bg-white p-5">
                <h3 className="font-serif text-2xl">
                  Private details
                </h3>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <p>
                    <strong>Legal name:</strong>{" "}
                    {
                      activeApplication
                        .privateDetails
                        .legalName
                    }
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {
                      activeApplication
                        .privateDetails.email
                    }
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {activeApplication
                      .privateDetails.phone ||
                      "Not provided"}
                  </p>
                  <p>
                    <strong>Screening number:</strong>{" "}
                    {activeApplication
                      .privateDetails
                      .screeningNumber ||
                      "Not provided"}
                  </p>
                </div>
              </section>

              <section className="mt-5 rounded-[22px] border border-[#ddcfbd] bg-white p-5">
                <h3 className="font-serif text-2xl">
                  Training
                </h3>

                <div className="mt-4 space-y-3">
                  {activeApplication.trainingProgress.map(
                    (module) => (
                      <article
                        key={module.moduleId}
                        className="rounded-[16px] bg-[#f5ecdf] p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-medium">
                            {module.title}
                          </p>

                          <span className="text-sm text-[#705d4d]">
                            {module.status} ·{" "}
                            {module.knowledgeCheckScore ??
                              "No score"}
                            %
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-[#6d5e50]">
                          {module.reflectionResponse ||
                            "No reflection supplied."}
                        </p>
                      </article>
                    ),
                  )}
                </div>
              </section>

              <section className="mt-5 rounded-[22px] border border-[#ddcfbd] bg-white p-5">
                <h3 className="font-serif text-2xl">
                  Evidence
                </h3>

                <div className="mt-4 space-y-3">
                  {activeApplication.evidence.length ===
                  0 ? (
                    <p className="rounded-[16px] bg-[#f5ecdf] p-4">
                      No evidence supplied.
                    </p>
                  ) : (
                    activeApplication.evidence.map(
                      (record) => (
                        <article
                          key={record.id}
                          className="rounded-[16px] bg-[#f5ecdf] p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-medium">
                                {record.label}
                              </p>

                              <p className="mt-1 text-sm text-[#705d4d]">
                                {record.type} ·{" "}
                                {record.status}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  verifyEvidence(
                                    record.id,
                                    "verified",
                                  )
                                }
                                className="rounded-full bg-[#60432f] px-3 py-2 text-sm text-white"
                              >
                                Verify
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  verifyEvidence(
                                    record.id,
                                    "rejected",
                                  )
                                }
                                className="rounded-full bg-[#ead7c4] px-3 py-2 text-sm text-[#60432f]"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </article>
                      ),
                    )
                  )}
                </div>
              </section>

              <section className="mt-5 rounded-[22px] border border-[#ddcfbd] bg-white p-5">
                <h3 className="font-serif text-2xl">
                  Public profile preview
                </h3>

                <div className="mt-4 rounded-[18px] bg-[#f5ecdf] p-5">
                  <p className="font-serif text-2xl">
                    {activeApplication
                      .publicProfile
                      .displayName ||
                      "Display name missing"}
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#705d4d]">
                    {activeApplication
                      .publicProfile.headline ||
                      "Headline missing"}
                  </p>

                  <p className="mt-4 leading-7 text-[#6d5e50]">
                    {activeApplication
                      .publicProfile.summary ||
                      "Profile summary missing."}
                  </p>

                  <p className="mt-3 text-sm text-[#705d4d]">
                    {
                      activeApplication
                        .publicProfile
                        .generalLocation
                    }
                  </p>
                </div>
              </section>

              <section className="mt-5 rounded-[22px] border border-[#ddcfbd] bg-[#efe4d4] p-5">
                <h3 className="font-serif text-2xl">
                  Reviewer decision
                </h3>

                <textarea
                  value={reviewNote}
                  onChange={(event) =>
                    setReviewNote(
                      event.target.value,
                    )
                  }
                  placeholder="Review note or required changes"
                  className="mt-4 min-h-28 w-full resize-none rounded-[16px] border border-[#d6c6b1] bg-white px-4 py-3"
                />

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={requestChanges}
                    className="rounded-full bg-[#d9bea1] px-5 py-3 font-medium text-[#4f3728]"
                  >
                    Request changes
                  </button>

                  <button
                    type="button"
                    onClick={approveApplication}
                    disabled={!approvalReady}
                    className="rounded-full bg-[#60432f] px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Approve worker
                  </button>

                  <button
                    type="button"
                    onClick={suspendApplication}
                    className="rounded-full border border-[#8d6a50] bg-white px-5 py-3 font-medium text-[#60432f]"
                  >
                    Suspend
                  </button>
                </div>

                <p className="mt-4 text-sm leading-6 text-[#705d4d]">
                  Approval activates the Smiling
                  Monad Trained badge, sets a
                  12-month review date and creates
                  the public Connections profile.
                  Private evidence is never copied
                  into the public profile.
                </p>
              </section>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[16px] bg-[#f5ecdf] p-4 text-sm">
                  Last reviewed:{" "}
                  {formatDate(
                    activeApplication
                      .lastReviewedAt,
                  )}
                </div>

                <div className="rounded-[16px] bg-[#f5ecdf] p-4 text-sm">
                  Renewal due:{" "}
                  {formatDate(
                    activeApplication
                      .renewalDueAt,
                  )}
                </div>

                <div className="rounded-[16px] bg-[#f5ecdf] p-4 text-sm">
                  Public profile:{" "}
                  {activeApplication
                    .connectionProfileId
                    ? "Created"
                    : "Not created"}
                </div>
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}