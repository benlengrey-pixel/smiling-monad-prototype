"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import { moduleOneRightsAndWorkerRole } from "@/lib/training/module-1";
import {
  completeTrainingSection,
  openTrainingSection,
  readTrainingRecord,
  recordSectionEngagement,
  subscribeToTrainingRecords,
} from "@/lib/training/progress-client";
import type {
  LearningSection,
  TrainingRecord,
  WorkerModuleAttempt,
} from "@/lib/training/types";

function findModuleAttempt(
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

function getSectionStatusLabel(
  status:
    | "not-started"
    | "in-progress"
    | "completed",
): string {
  switch (status) {
    case "not-started":
      return "Not started";
    case "in-progress":
      return "In progress";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

function getBlockClass(
  type: string,
): string {
  switch (type) {
    case "warning":
      return "border-amber-200 bg-amber-50";
    case "participant-perspective":
      return "border-sky-200 bg-sky-50";
    case "scenario":
      return "border-violet-200 bg-violet-50";
    case "example":
      return "border-emerald-200 bg-emerald-50";
    case "source-reference":
      return "border-slate-200 bg-slate-50";
    default:
      return "border-black/10 bg-white/70";
  }
}

function ModuleLearningFallback() {
  return (
    <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
          Smiling Monad School
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Loading Module 1
        </h1>

        <p className="mt-4 leading-7 text-black/70">
          Opening the worker&apos;s learning record.
        </p>
      </div>
    </main>
  );
}

function ModuleOneLearningContent() {
  const searchParams = useSearchParams();
  const workerApplicationId =
    searchParams.get("applicationId")?.trim() ??
    "";

  const module =
    moduleOneRightsAndWorkerRole;

  const [trainingRecord, setTrainingRecord] =
    useState<TrainingRecord | null>(null);
  const [activeSectionId, setActiveSectionId] =
    useState<string>(
      module.sections[0]?.id ?? "",
    );
  const [completionResponse, setCompletionResponse] =
    useState("");
  const [message, setMessage] =
    useState("");

  useEffect(() => {
    if (!workerApplicationId) {
      setTrainingRecord(null);
      return;
    }

    const refresh = () => {
      setTrainingRecord(
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
    () => findModuleAttempt(trainingRecord),
    [trainingRecord],
  );

  const activeSection = useMemo(
    () =>
      module.sections.find(
        (section) =>
          section.id === activeSectionId,
      ) ??
      module.sections[0],
    [activeSectionId, module.sections],
  );

  const activeProgress =
    moduleAttempt?.sectionProgress.find(
      (progress) =>
        progress.sectionId ===
        activeSection?.id,
    );

  useEffect(() => {
    if (
      !workerApplicationId ||
      !activeSection ||
      !moduleAttempt
    ) {
      return;
    }

    openTrainingSection(
      workerApplicationId,
      module.id,
      activeSection.id,
    );

    const interval = window.setInterval(
      () => {
        recordSectionEngagement(
          workerApplicationId,
          module.id,
          activeSection.id,
          15,
        );
      },
      15000,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [
    activeSection,
    module.id,
    moduleAttempt,
    workerApplicationId,
  ]);

  useEffect(() => {
    setCompletionResponse(
      activeProgress?.completionResponse ??
        "",
    );
  }, [
    activeProgress?.completionResponse,
    activeSectionId,
  ]);

  function chooseSection(
    section: LearningSection,
  ) {
    setMessage("");
    setActiveSectionId(section.id);
  }

  function completeSection() {
    if (
      !workerApplicationId ||
      !activeSection
    ) {
      return;
    }

    try {
      completeTrainingSection(
        workerApplicationId,
        module,
        activeSection.id,
        completionResponse,
      );

      setMessage(
        "Section completed and saved.",
      );

      const currentIndex =
        module.sections.findIndex(
          (section) =>
            section.id ===
            activeSection.id,
        );

      const nextSection =
        module.sections[currentIndex + 1];

      if (nextSection) {
        setActiveSectionId(
          nextSection.id,
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to complete this section.",
      );
    }
  }

  if (
    !workerApplicationId ||
    !trainingRecord ||
    !moduleAttempt
  ) {
    return (
      <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
            Smiling Monad School
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Module 1
          </h1>

          <p className="mt-4 leading-7 text-black/70">
            Start the training program from
            your worker training dashboard before
            opening this module.
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

  const completedCount =
    moduleAttempt.sectionProgress.filter(
      (section) =>
        section.status === "completed",
    ).length;

  const allSectionsComplete =
    completedCount ===
    module.sections.length;

  return (
    <main className="min-h-screen bg-[#f4efe5] px-4 py-6 text-[#2c2a26] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
              {module.code} · Version{" "}
              {module.version}
            </p>

            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              {module.title}
            </h1>

            <p className="mt-3 leading-7 text-black/65">
              {module.purpose}
            </p>
          </div>

          <Link
            href={`/school/workers/training?applicationId=${encodeURIComponent(
              workerApplicationId,
            )}`}
            className="rounded-full border border-black/15 bg-white/70 px-5 py-3 text-sm font-semibold"
          >
            Training dashboard
          </Link>
        </header>

        <div className="mt-7 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-black/10 bg-white/75 p-4 shadow-sm lg:sticky lg:top-6 lg:self-start">
            <div className="px-2 py-2">
              <p className="text-sm font-semibold">
                Learning progress
              </p>

              <p className="mt-1 text-sm text-black/50">
                {completedCount} of{" "}
                {module.sections.length} sections
                completed
              </p>
            </div>

            <div className="mt-3 space-y-2">
              {module.sections.map(
                (section) => {
                  const progress =
                    moduleAttempt.sectionProgress.find(
                      (item) =>
                        item.sectionId ===
                        section.id,
                    );

                  const isActive =
                    section.id ===
                    activeSection?.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() =>
                        chooseSection(section)
                      }
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-[#596b4d] bg-[#eef3e8]"
                          : "border-black/10 bg-white/60 hover:bg-white"
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                        Section {section.order}
                      </p>

                      <p className="mt-1 font-semibold">
                        {section.title}
                      </p>

                      <p className="mt-2 text-xs text-black/50">
                        {getSectionStatusLabel(
                          progress?.status ??
                            "not-started",
                        )}
                      </p>
                    </button>
                  );
                },
              )}
            </div>
          </aside>

          <section className="rounded-[2rem] border border-black/10 bg-white/75 p-5 shadow-sm sm:p-8">
            {activeSection ? (
              <>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-black/45">
                    Section {activeSection.order}
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold">
                    {activeSection.title}
                  </h2>

                  <p className="mt-3 leading-7 text-black/65">
                    {activeSection.summary}
                  </p>
                </div>

                <div className="mt-7 space-y-5">
                  {activeSection.contentBlocks.map(
                    (block) => (
                      <article
                        key={block.id}
                        className={`rounded-3xl border p-5 ${getBlockClass(
                          block.type,
                        )}`}
                      >
                        {block.title ? (
                          <h3 className="text-lg font-semibold">
                            {block.title}
                          </h3>
                        ) : null}

                        {block.type ===
                        "heading" ? (
                          <h3 className="text-xl font-semibold">
                            {block.content}
                          </h3>
                        ) : (
                          <p className="leading-7 text-black/70">
                            {block.content}
                          </p>
                        )}

                        {block.items?.length ? (
                          <ul className="mt-4 space-y-2 pl-5 text-black/70">
                            {block.items.map(
                              (item) => (
                                <li
                                  key={item}
                                  className="list-disc leading-6"
                                >
                                  {item}
                                </li>
                              ),
                            )}
                          </ul>
                        ) : null}

                        {block.sourceReference ? (
                          <p className="mt-4 break-words text-sm text-black/45">
                            {
                              block.sourceReference
                            }
                          </p>
                        ) : null}
                      </article>
                    ),
                  )}
                </div>

                <div className="mt-8 rounded-3xl border border-black/10 bg-[#f7f3eb] p-5">
                  <h3 className="text-lg font-semibold">
                    Section response
                  </h3>

                  <p className="mt-2 leading-7 text-black/65">
                    {
                      activeSection.completionPrompt
                    }
                  </p>

                  <textarea
                    value={completionResponse}
                    onChange={(event) =>
                      setCompletionResponse(
                        event.target.value,
                      )
                    }
                    rows={6}
                    className="mt-4 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                    placeholder="Write your response in your own words."
                  />

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-black/50">
                      Engagement recorded:{" "}
                      {activeProgress?.engagementSeconds ??
                        0}{" "}
                      seconds · Minimum required:{" "}
                      {
                        activeSection.minimumEngagementSeconds
                      }{" "}
                      seconds
                    </p>

                    <button
                      type="button"
                      onClick={completeSection}
                      className="rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
                    >
                      Complete section
                    </button>
                  </div>

                  {message ? (
                    <p className="mt-4 rounded-2xl bg-black/5 px-4 py-3 text-sm">
                      {message}
                    </p>
                  ) : null}
                </div>

                {allSectionsComplete ? (
                  <div className="mt-7 rounded-3xl border border-[#b8c7a8] bg-[#eef3e8] p-5">
                    <h3 className="text-xl font-semibold">
                      Learning sections complete
                    </h3>

                    <p className="mt-2 leading-7 text-black/65">
                      Your section responses and
                      engagement record have been
                      saved. The next step will be
                      the protected Module 1
                      assessment.
                    </p>
                  </div>
                ) : null}
              </>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

export default function ModuleOneLearningPage() {
  return (
    <Suspense fallback={<ModuleLearningFallback />}>
      <ModuleOneLearningContent />
    </Suspense>
  );
}