"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addSchoolLesson,
  addWorkerApplication,
  isWorkerEligibleForApproval,
  isWorkerEvidenceReady,
  isWorkerProfileReady,
  isWorkerTrainingComplete,
  readSmilingMonadState,
  subscribeToSmilingMonadState,
  updateWorkerApplication,
  type SchoolLesson,
  type WorkerApplication,
  type WorkerEvidenceType,
} from "@/lib/platform/smiling-monad-state";

type LearningArea =
  | "support"
  | "communication"
  | "behaviour"
  | "circles"
  | "development";

type LearningAreaDetails = {
  title: string;
  description: string;
  lessons: string[];
};

type WorkerPanel =
  | "overview"
  | "training"
  | "evidence"
  | "profile"
  | "review";

const learningAreas: Record<
  LearningArea,
  LearningAreaDetails
> = {
  support: {
    title: "Thoughtful Support Work",
    description:
      "Practical learning for support workers who want to provide reliable, respectful and person-centred support.",
    lessons: [
      "Understanding the whole person",
      "Building trust and consistency",
      "Supporting choice and control",
      "Professional boundaries",
      "Writing useful shift notes",
    ],
  },

  communication: {
    title: "Communication",
    description:
      "Learn how to understand communication in all its forms and reduce frustration, confusion and unnecessary conflict.",
    lessons: [
      "Communication beyond speech",
      "Visual communication systems",
      "Listening for meaning",
      "Supporting transitions",
      "Working with families and teams",
    ],
  },

  behaviour: {
    title: "Behaviour as Communication",
    description:
      "A compassionate approach to understanding behaviour, identifying unmet needs and supporting safer outcomes.",
    lessons: [
      "Looking beneath behaviour",
      "Recognising stress and overload",
      "Understanding triggers",
      "Reducing restrictive responses",
      "Building proactive support",
    ],
  },

  circles: {
    title: "Building Circles of Support",
    description:
      "Learn how to bring the right people together around a participant, family, project or shared goal.",
    lessons: [
      "Choosing trusted people",
      "Defining roles clearly",
      "Sharing information safely",
      "Running useful meetings",
      "Maintaining healthy relationships",
    ],
  },

  development: {
    title: "Personal & Professional Development",
    description:
      "Learning that supports reflection, wellbeing, confidence and long-term growth.",
    lessons: [
      "Reflective practice",
      "Preventing burnout",
      "Managing difficult conversations",
      "Values-led decision making",
      "Remembering why the work matters",
    ],
  },
};

const evidenceLabels: Record<
  WorkerEvidenceType,
  string
> = {
  identity: "Identity",
  "ndis-worker-screening":
    "NDIS Worker Screening",
  "worker-orientation-module":
    "NDIS Worker Orientation Module",
  "first-aid": "First Aid",
  "working-with-children":
    "Working With Children Check",
  qualification: "Qualification",
  experience: "Experience evidence",
  insurance: "Insurance",
  other: "Other evidence",
};

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SchoolPage() {
  const [activeArea, setActiveArea] =
    useState<LearningArea | null>(null);

  const [lessons, setLessons] =
    useState<SchoolLesson[]>([]);

  const [applications, setApplications] =
    useState<WorkerApplication[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [composerOpen, setComposerOpen] =
    useState(false);

  const [workerOpen, setWorkerOpen] =
    useState(false);

  const [workerPanel, setWorkerPanel] =
    useState<WorkerPanel>("overview");

  const [activeApplicationId, setActiveApplicationId] =
    useState<string | null>(null);

  const [lessonArea, setLessonArea] =
    useState<LearningArea>("support");

  const [lessonTitle, setLessonTitle] =
    useState("");

  const [lessonSummary, setLessonSummary] =
    useState("");

  const [lessonContent, setLessonContent] =
    useState("");

  const [applicantName, setApplicantName] =
    useState("");

  const [applicantEmail, setApplicantEmail] =
    useState("");

  const [evidenceType, setEvidenceType] =
    useState<WorkerEvidenceType>("identity");

  const [evidenceLabel, setEvidenceLabel] =
    useState("");

  const [evidenceReference, setEvidenceReference] =
    useState("");

  useEffect(() => {
    const state =
      readSmilingMonadState();

    setLessons(state.schoolLessons);
    setApplications(
      state.workerApplications,
    );

    if (
      state.workerApplications.length > 0
    ) {
      setActiveApplicationId(
        state.workerApplications[
          state.workerApplications.length - 1
        ].id,
      );
    }

    setLoaded(true);

    return subscribeToSmilingMonadState(
      (nextState) => {
        setLessons(
          nextState.schoolLessons,
        );
        setApplications(
          nextState.workerApplications,
        );
      },
    );
  }, []);

  const activeApplication = useMemo(
    () =>
      applications.find(
        (application) =>
          application.id ===
          activeApplicationId,
      ) ?? null,
    [
      applications,
      activeApplicationId,
    ],
  );

  const publishedLessons = useMemo(
    () =>
      lessons.filter(
        (lesson) =>
          lesson.status === "published",
      ),
    [lessons],
  );

  const reviewLessons = useMemo(
    () =>
      lessons.filter(
        (lesson) =>
          lesson.status === "review",
      ),
    [lessons],
  );

  const draftLessons = useMemo(
    () =>
      lessons.filter(
        (lesson) =>
          lesson.status === "draft",
      ),
    [lessons],
  );

  const selectedArea = activeArea
    ? learningAreas[activeArea]
    : null;

  const selectedPublishedLessons =
    useMemo(
      () =>
        activeArea
          ? publishedLessons.filter(
              (lesson) =>
                lesson.area === activeArea,
            )
          : [],
      [activeArea, publishedLessons],
    );

  const completedModuleCount =
    activeApplication?.trainingProgress.filter(
      (module) =>
        module.status === "completed",
    ).length ?? 0;

  const trainingComplete =
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

  function saveLessonForReview() {
    const title = lessonTitle.trim();
    const summary =
      lessonSummary.trim();

    if (!title || !summary) {
      return;
    }

    addSchoolLesson({
      area: lessonArea,
      title,
      summary,
      content:
        lessonContent.trim(),
      status: "review",
    });

    setLessonArea("support");
    setLessonTitle("");
    setLessonSummary("");
    setLessonContent("");
    setComposerOpen(false);
  }

  function startWorkerApplication() {
    const application =
      addWorkerApplication({
        legalName:
          applicantName.trim(),
        email:
          applicantEmail.trim(),
      });

    setActiveApplicationId(
      application.id,
    );
    setApplicantName("");
    setApplicantEmail("");
    setWorkerPanel("overview");
  }

  function updateApplication(
    updater: (
      application: WorkerApplication,
    ) => WorkerApplication,
  ) {
    if (!activeApplication) {
      return;
    }

    updateWorkerApplication(
      activeApplication.id,
      updater,
    );
  }

  function updateModule(
    moduleId: string,
    updater: (
      module: WorkerApplication["trainingProgress"][number],
    ) => WorkerApplication["trainingProgress"][number],
  ) {
    updateApplication(
      (application) => ({
        ...application,
        status:
          application.status === "draft"
            ? "training"
            : application.status,
        trainingProgress:
          application.trainingProgress.map(
            (module) =>
              module.moduleId === moduleId
                ? updater(module)
                : module,
          ),
      }),
    );
  }

  function addEvidence() {
    if (
      !activeApplication ||
      !evidenceLabel.trim()
    ) {
      return;
    }

    updateApplication(
      (application) => ({
        ...application,
        evidence: [
          ...application.evidence,
          {
            id:
              globalThis.crypto?.randomUUID?.() ??
              `${Date.now()}`,
            type: evidenceType,
            label:
              evidenceLabel.trim(),
            status: "provided",
            documentReference:
              evidenceReference.trim(),
            issuedBy: "",
            issuedAt: null,
            expiresAt: null,
            reviewerNote: "",
            verifiedAt: null,
          },
        ],
      }),
    );

    setEvidenceLabel("");
    setEvidenceReference("");
  }

  function submitForReview() {
    if (
      !activeApplication ||
      !approvalReady
    ) {
      return;
    }

    updateApplication(
      (application) => ({
        ...application,
        status: "profile-review",
        submittedAt:
          new Date().toISOString(),
        badgeStatus: "eligible",
      }),
    );
  }

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#e9f0e4_0%,#f8f1e6_54%,#ead7bd_100%)] px-4 pb-14 pt-5 text-[#40352c] sm:px-8 sm:pt-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link
          href="/market"
          aria-label="Return to the Smiling Monad Market"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#7c6a58]/25 bg-white/75 text-xl shadow-sm backdrop-blur-md transition hover:bg-white"
        >
          ←
        </Link>

        <div className="min-w-0 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#7d715f] sm:text-xs">
            The Smiling Monad Market
          </p>

          <h1 className="mt-1 font-serif text-2xl sm:text-4xl">
            Smiling Monad School
          </h1>
        </div>

        <Link
          href="/office"
          className="rounded-full border border-[#7c6a58]/25 bg-white/75 px-4 py-2 text-sm shadow-sm backdrop-blur-md transition hover:bg-white"
        >
          Space
        </Link>
      </header>

      <section className="mx-auto mt-8 w-full max-w-6xl rounded-[32px] border border-white/70 bg-white/60 p-5 shadow-[0_24px_70px_rgba(78,60,40,0.12)] backdrop-blur-xl sm:mt-12 sm:p-9">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-serif text-3xl leading-tight sm:text-5xl">
            Learn to support people well.
          </p>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#695d51]">
            The Smiling Monad School brings together
            practical skills, lived experience and a
            thoughtful approach to human support.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                setWorkerOpen(true)
              }
              className="rounded-full bg-[#60432f] px-5 py-3 font-medium text-white transition hover:bg-[#4f3728]"
            >
              Become a trained worker
            </button>

            <button
              type="button"
              onClick={() =>
                setComposerOpen(true)
              }
              className="rounded-full border border-[#60432f]/25 bg-white/80 px-5 py-3 font-medium text-[#60432f] transition hover:bg-white"
            >
              Prepare a lesson
            </button>
          </div>
        </div>

        <section className="mt-10 rounded-[28px] border border-[#cdbba3] bg-[#f1e5d4] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#806b55]">
                Trusted worker pathway
              </p>

              <h2 className="mt-3 font-serif text-3xl">
                Become a Smiling Monad Trained Worker
              </h2>

              <p className="mt-3 max-w-3xl leading-7 text-[#68594d]">
                Complete the learning pathway,
                demonstrate your understanding,
                provide required evidence, build a
                public-safe profile and submit it for
                human review. Profiles remain hidden
                until approval.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setWorkerOpen(true)
              }
              className="rounded-full bg-[#60432f] px-6 py-3 font-medium text-white"
            >
              Open worker pathway
            </button>
          </div>
        </section>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            Object.entries(
              learningAreas,
            ) as Array<
              [
                LearningArea,
                LearningAreaDetails,
              ]
            >
          ).map(([key, area]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setActiveArea(key)
              }
              className="group min-h-52 rounded-[24px] border border-[#d9cbb9] bg-[rgba(255,251,244,0.84)] p-6 text-left shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
            >
              <p className="font-serif text-2xl">
                {area.title}
              </p>

              <p className="mt-3 leading-7 text-[#706255]">
                {area.description}
              </p>

              <p className="mt-5 text-sm font-semibold text-[#765943]">
                View learning area →
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <section className="rounded-[24px] border border-[#d6c6b2] bg-[#efe4d4]/75 p-5">
            <p className="font-serif text-2xl">
              Published
            </p>
            <p className="mt-3 text-[#6c5e51]">
              {loaded
                ? publishedLessons.length
                : "…"}{" "}
              lessons available
            </p>
          </section>

          <section className="rounded-[24px] border border-[#d6c6b2] bg-[#efe4d4]/75 p-5">
            <p className="font-serif text-2xl">
              Awaiting review
            </p>
            <p className="mt-3 text-[#6c5e51]">
              {reviewLessons.length} lessons
            </p>
          </section>

          <section className="rounded-[24px] border border-[#d6c6b2] bg-[#efe4d4]/75 p-5">
            <p className="font-serif text-2xl">
              Drafts
            </p>
            <p className="mt-3 text-[#6c5e51]">
              {draftLessons.length} lessons
            </p>
          </section>
        </div>
      </section>

      {workerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <section className="relative max-h-[94svh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-[#d8c7b1] bg-[#fffaf2] p-5 shadow-[0_30px_80px_rgba(35,24,15,0.42)] sm:p-8">
            <button
              type="button"
              onClick={() =>
                setWorkerOpen(false)
              }
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eee2d2] text-xl"
            >
              ×
            </button>

            <p className="pr-12 text-xs font-semibold uppercase tracking-[0.25em] text-[#846e58]">
              Worker training and verification
            </p>

            <h2 className="mt-3 pr-12 font-serif text-3xl sm:text-4xl">
              Smiling Monad Trained Worker Pathway
            </h2>

            {!activeApplication ? (
              <div className="mt-7 max-w-2xl rounded-[24px] border border-[#ddcfbd] bg-[#f5ecdf] p-6">
                <p className="font-serif text-2xl">
                  Start your application
                </p>

                <p className="mt-3 leading-7 text-[#6b5c50]">
                  Your legal name and contact details
                  stay private and are never shown on
                  your public worker profile.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <input
                    value={applicantName}
                    onChange={(event) =>
                      setApplicantName(
                        event.target.value,
                      )
                    }
                    placeholder="Legal name"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
                  />

                  <input
                    type="email"
                    value={applicantEmail}
                    onChange={(event) =>
                      setApplicantEmail(
                        event.target.value,
                      )
                    }
                    placeholder="Email"
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
                  />
                </div>

                <button
                  type="button"
                  onClick={startWorkerApplication}
                  disabled={
                    !applicantName.trim() ||
                    !applicantEmail.trim()
                  }
                  className="mt-4 w-full rounded-full bg-[#60432f] px-5 py-3 font-medium text-white disabled:opacity-50"
                >
                  Start application
                </button>
              </div>
            ) : (
              <>
                <div className="mt-6 flex flex-wrap gap-2">
                  {(
                    [
                      ["overview", "Overview"],
                      ["training", "Training"],
                      ["evidence", "Evidence"],
                      ["profile", "Profile"],
                      ["review", "Review"],
                    ] as Array<
                      [WorkerPanel, string]
                    >
                  ).map(([panel, label]) => (
                    <button
                      key={panel}
                      type="button"
                      onClick={() =>
                        setWorkerPanel(panel)
                      }
                      className={`rounded-full px-4 py-2 text-sm ${
                        workerPanel === panel
                          ? "bg-[#60432f] text-white"
                          : "bg-[#efe3d3] text-[#60432f]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {workerPanel === "overview" && (
                  <div className="mt-7">
                    <div className="grid gap-4 md:grid-cols-4">
                      {[
                        {
                          label: "Training",
                          value: `${completedModuleCount}/${activeApplication.trainingProgress.length}`,
                          ready:
                            trainingComplete,
                        },
                        {
                          label: "Evidence",
                          value:
                            evidenceReady
                              ? "Ready"
                              : "Incomplete",
                          ready: evidenceReady,
                        },
                        {
                          label: "Profile",
                          value:
                            profileReady
                              ? "Ready"
                              : "Incomplete",
                          ready: profileReady,
                        },
                        {
                          label: "Application",
                          value:
                            activeApplication.status,
                          ready:
                            activeApplication.status ===
                            "approved",
                        },
                      ].map((item) => (
                        <section
                          key={item.label}
                          className="rounded-[20px] border border-[#deceba] bg-[#f4eadc] p-5"
                        >
                          <p className="text-sm text-[#765f4d]">
                            {item.label}
                          </p>
                          <p className="mt-2 font-serif text-2xl">
                            {item.value}
                          </p>
                        </section>
                      ))}
                    </div>

                    <div className="mt-6 rounded-[22px] border border-[#d9cab6] bg-[#efe4d4] p-5">
                      <p className="font-serif text-2xl">
                        What this badge means
                      </p>
                      <p className="mt-3 leading-7 text-[#6d5e50]">
                        The Smiling Monad Trained badge
                        means the worker completed this
                        pathway, supplied the required
                        evidence and passed human review.
                        It is not government accreditation.
                      </p>
                    </div>
                  </div>
                )}

                {workerPanel === "training" && (
                  <div className="mt-7 space-y-4">
                    {activeApplication.trainingProgress.map(
                      (module, index) => (
                        <article
                          key={module.moduleId}
                          className="rounded-[22px] border border-[#dccdb9] bg-white p-5"
                        >
                          <div className="flex items-start gap-4">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#decdb8] font-semibold">
                              {index + 1}
                            </span>

                            <div className="flex-1">
                              <p className="font-serif text-xl">
                                {module.title}
                              </p>

                              <select
                                value={module.status}
                                onChange={(event) =>
                                  updateModule(
                                    module.moduleId,
                                    (current) => ({
                                      ...current,
                                      status:
                                        event.target
                                          .value as typeof current.status,
                                      completedAt:
                                        event.target
                                          .value ===
                                        "completed"
                                          ? new Date().toISOString()
                                          : null,
                                    }),
                                  )
                                }
                                className="mt-3 rounded-xl border border-[#d6c6b1] bg-white px-3 py-2"
                              >
                                <option value="not-started">
                                  Not started
                                </option>
                                <option value="in-progress">
                                  In progress
                                </option>
                                <option value="completed">
                                  Completed
                                </option>
                                <option value="needs-review">
                                  Needs review
                                </option>
                              </select>

                              <div className="mt-4 grid gap-3 sm:grid-cols-[0.35fr_0.65fr]">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={
                                    module.knowledgeCheckScore ??
                                    ""
                                  }
                                  onChange={(event) =>
                                    updateModule(
                                      module.moduleId,
                                      (current) => ({
                                        ...current,
                                        knowledgeCheckScore:
                                          event.target.value ===
                                          ""
                                            ? null
                                            : Number(
                                                event.target.value,
                                              ),
                                        knowledgeCheckStatus:
                                          Number(
                                            event.target.value,
                                          ) >= 80
                                            ? "passed"
                                            : "needs-review",
                                      }),
                                    )
                                  }
                                  placeholder="Knowledge score %"
                                  className="rounded-xl border border-[#d6c6b1] px-3 py-2"
                                />

                                <textarea
                                  value={
                                    module.reflectionResponse
                                  }
                                  onChange={(event) =>
                                    updateModule(
                                      module.moduleId,
                                      (current) => ({
                                        ...current,
                                        reflectionResponse:
                                          event.target.value,
                                      }),
                                    )
                                  }
                                  placeholder="Reflection: what will this change in your practice?"
                                  className="min-h-24 resize-none rounded-xl border border-[#d6c6b1] px-3 py-2"
                                />
                              </div>
                            </div>
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                )}

                {workerPanel === "evidence" && (
                  <div className="mt-7">
                    <div className="rounded-[22px] border border-[#dccdb9] bg-[#f4eadc] p-5">
                      <p className="font-serif text-2xl">
                        Add evidence
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <select
                          value={evidenceType}
                          onChange={(event) =>
                            setEvidenceType(
                              event.target
                                .value as WorkerEvidenceType,
                            )
                          }
                          className="rounded-xl border border-[#d6c6b1] bg-white px-3 py-3"
                        >
                          {(
                            Object.entries(
                              evidenceLabels,
                            ) as Array<
                              [
                                WorkerEvidenceType,
                                string,
                              ]
                            >
                          ).map(
                            ([value, label]) => (
                              <option
                                key={value}
                                value={value}
                              >
                                {label}
                              </option>
                            ),
                          )}
                        </select>

                        <input
                          value={evidenceLabel}
                          onChange={(event) =>
                            setEvidenceLabel(
                              event.target.value,
                            )
                          }
                          placeholder="Evidence name"
                          className="rounded-xl border border-[#d6c6b1] bg-white px-3 py-3"
                        />

                        <input
                          value={evidenceReference}
                          onChange={(event) =>
                            setEvidenceReference(
                              event.target.value,
                            )
                          }
                          placeholder="Private file reference"
                          className="rounded-xl border border-[#d6c6b1] bg-white px-3 py-3"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={addEvidence}
                        className="mt-3 w-full rounded-full bg-[#60432f] px-5 py-3 text-white"
                      >
                        Add evidence record
                      </button>
                    </div>

                    <div className="mt-5 space-y-3">
                      {activeApplication.evidence.map(
                        (record) => (
                          <article
                            key={record.id}
                            className="rounded-[18px] border border-[#ddcfbd] bg-white p-4"
                          >
                            <p className="font-medium">
                              {record.label}
                            </p>
                            <p className="mt-1 text-sm text-[#756151]">
                              {
                                evidenceLabels[
                                  record.type
                                ]
                              }{" "}
                              · {record.status}
                            </p>
                          </article>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {workerPanel === "profile" && (
                  <div className="mt-7 grid gap-4">
                    <input
                      value={
                        activeApplication
                          .publicProfile
                          .displayName
                      }
                      onChange={(event) =>
                        updateApplication(
                          (application) => ({
                            ...application,
                            publicProfile: {
                              ...application.publicProfile,
                              displayName:
                                event.target.value,
                            },
                          }),
                        )
                      }
                      placeholder="Public display name"
                      className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
                    />

                    <input
                      value={
                        activeApplication
                          .publicProfile.headline
                      }
                      onChange={(event) =>
                        updateApplication(
                          (application) => ({
                            ...application,
                            publicProfile: {
                              ...application.publicProfile,
                              headline:
                                event.target.value,
                            },
                          }),
                        )
                      }
                      placeholder="Profile headline"
                      className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
                    />

                    <textarea
                      value={
                        activeApplication
                          .publicProfile.summary
                      }
                      onChange={(event) =>
                        updateApplication(
                          (application) => ({
                            ...application,
                            publicProfile: {
                              ...application.publicProfile,
                              summary:
                                event.target.value,
                            },
                          }),
                        )
                      }
                      placeholder="Public profile summary"
                      className="min-h-32 resize-none rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
                    />

                    <input
                      value={
                        activeApplication
                          .publicProfile
                          .generalLocation
                      }
                      onChange={(event) =>
                        updateApplication(
                          (application) => ({
                            ...application,
                            publicProfile: {
                              ...application.publicProfile,
                              generalLocation:
                                event.target.value,
                            },
                          }),
                        )
                      }
                      placeholder="General location"
                      className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
                    />

                    <textarea
                      value={
                        activeApplication
                          .publicProfile
                          .communicationApproach
                      }
                      onChange={(event) =>
                        updateApplication(
                          (application) => ({
                            ...application,
                            publicProfile: {
                              ...application.publicProfile,
                              communicationApproach:
                                event.target.value,
                            },
                          }),
                        )
                      }
                      placeholder="Communication and support approach"
                      className="min-h-28 resize-none rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
                    />

                    <input
                      value={
                        activeApplication
                          .publicProfile.travelAreas.join(
                            ", ",
                          )
                      }
                      onChange={(event) =>
                        updateApplication(
                          (application) => ({
                            ...application,
                            publicProfile: {
                              ...application.publicProfile,
                              travelAreas:
                                parseList(
                                  event.target.value,
                                ),
                            },
                          }),
                        )
                      }
                      placeholder="Travel areas, separated by commas"
                      className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
                    />

                    <input
                      value={
                        activeApplication
                          .publicProfile
                          .supportInterests.join(
                            ", ",
                          )
                      }
                      onChange={(event) =>
                        updateApplication(
                          (application) => ({
                            ...application,
                            publicProfile: {
                              ...application.publicProfile,
                              supportInterests:
                                parseList(
                                  event.target.value,
                                ),
                            },
                          }),
                        )
                      }
                      placeholder="Support interests, separated by commas"
                      className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
                    />
                  </div>
                )}

                {workerPanel === "review" && (
                  <div className="mt-7">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[18px] border border-[#d8cab8] bg-[#f4eadc] p-4">
                        Training:{" "}
                        {trainingComplete
                          ? "Ready"
                          : "Incomplete"}
                      </div>
                      <div className="rounded-[18px] border border-[#d8cab8] bg-[#f4eadc] p-4">
                        Evidence:{" "}
                        {evidenceReady
                          ? "Ready"
                          : "Incomplete"}
                      </div>
                      <div className="rounded-[18px] border border-[#d8cab8] bg-[#f4eadc] p-4">
                        Profile:{" "}
                        {profileReady
                          ? "Ready"
                          : "Incomplete"}
                      </div>
                    </div>

                    <p className="mt-5 rounded-[18px] border border-[#d9cab6] bg-[#efe4d4] p-4 leading-7 text-[#6d5e50]">
                      Submission sends the application
                      for human review. It does not make
                      the worker public and does not
                      activate the badge.
                    </p>

                    <button
                      type="button"
                      onClick={submitForReview}
                      disabled={
                        !approvalReady ||
                        activeApplication.status ===
                          "profile-review"
                      }
                      className="mt-4 w-full rounded-full bg-[#60432f] px-5 py-3 font-medium text-white disabled:opacity-50"
                    >
                      {activeApplication.status ===
                      "profile-review"
                        ? "Submitted for review"
                        : "Submit application for review"}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {selectedArea && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6">
          <section className="relative max-h-[90svh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#d8c7b1] bg-[#fffaf2] p-6 sm:p-8">
            <button
              type="button"
              onClick={() =>
                setActiveArea(null)
              }
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eee2d2] text-xl"
            >
              ×
            </button>

            <h2 className="pr-12 font-serif text-3xl">
              {selectedArea.title}
            </h2>

            <p className="mt-4 leading-7 text-[#6c5e51]">
              {selectedArea.description}
            </p>

            <div className="mt-6 space-y-3">
              {selectedArea.lessons.map(
                (lesson, index) => (
                  <div
                    key={lesson}
                    className="flex items-center gap-4 rounded-[16px] border border-[#dfd1bf] bg-[#f6eee2] px-4 py-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#decdb8] text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span>{lesson}</span>
                  </div>
                ),
              )}
            </div>

            {selectedPublishedLessons.map(
              (lesson) => (
                <article
                  key={lesson.id}
                  className="mt-4 rounded-[18px] border border-[#dfd1bf] bg-white p-5"
                >
                  <p className="font-serif text-xl">
                    {lesson.title}
                  </p>
                  <p className="mt-2 text-[#6c5e51]">
                    {lesson.summary}
                  </p>
                </article>
              ),
            )}
          </section>
        </div>
      )}

      {composerOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6">
          <section className="relative w-full max-w-2xl rounded-[28px] border border-[#d8c7b1] bg-[#fffaf2] p-6 sm:p-8">
            <button
              type="button"
              onClick={() =>
                setComposerOpen(false)
              }
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eee2d2] text-xl"
            >
              ×
            </button>

            <h2 className="pr-12 font-serif text-3xl">
              Prepare a lesson
            </h2>

            <div className="mt-6 space-y-4">
              <select
                value={lessonArea}
                onChange={(event) =>
                  setLessonArea(
                    event.target
                      .value as LearningArea,
                  )
                }
                className="w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3"
              >
                {Object.entries(
                  learningAreas,
                ).map(([value, area]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {area.title}
                  </option>
                ))}
              </select>

              <input
                value={lessonTitle}
                onChange={(event) =>
                  setLessonTitle(
                    event.target.value,
                  )
                }
                placeholder="Lesson title"
                className="w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3"
              />

              <textarea
                value={lessonSummary}
                onChange={(event) =>
                  setLessonSummary(
                    event.target.value,
                  )
                }
                placeholder="Short lesson summary"
                className="min-h-24 w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3"
              />

              <textarea
                value={lessonContent}
                onChange={(event) =>
                  setLessonContent(
                    event.target.value,
                  )
                }
                placeholder="Lesson content"
                className="min-h-36 w-full rounded-[16px] border border-[#d8c9b7] bg-white px-4 py-3"
              />
            </div>

            <button
              type="button"
              onClick={saveLessonForReview}
              disabled={
                !lessonTitle.trim() ||
                !lessonSummary.trim()
              }
              className="mt-6 w-full rounded-full bg-[#60432f] px-5 py-3 text-white disabled:opacity-50"
            >
              Save lesson for review
            </button>
          </section>
        </div>
      )}
    </main>
  );
}