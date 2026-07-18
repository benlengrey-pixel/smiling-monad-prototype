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
  getProgramModules,
  smilingMonadSupportWorkerFoundationProgram,
} from "@/lib/training/programs";
import {
  enrolWorkerInTrainingProgram,
  readTrainingRecord,
  subscribeToTrainingRecords,
} from "@/lib/training/progress-client";
import type {
  TrainingRecord,
  WorkerModuleAttempt,
} from "@/lib/training/types";

function formatStatus(
  status: WorkerModuleAttempt["status"],
): string {
  switch (status) {
    case "not-started":
      return "Not started";
    case "learning":
      return "Learning";
    case "assessment":
      return "Assessment";
    case "human-review":
      return "Human review";
    case "satisfactory":
      return "Satisfactory";
    case "not-yet-satisfactory":
      return "Further learning required";
    default:
      return status;
  }
}

function calculateSectionProgress(
  attempt: WorkerModuleAttempt,
): number {
  if (attempt.sectionProgress.length === 0) {
    return 0;
  }

  const completed =
    attempt.sectionProgress.filter(
      (section) =>
        section.status === "completed",
    ).length;

  return Math.round(
    (completed /
      attempt.sectionProgress.length) *
      100,
  );
}

function TrainingPageFallback() {
  return (
    <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
          Smiling Monad School
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Loading worker training
        </h1>

        <p className="mt-4 leading-7 text-black/70">
          Opening the worker&apos;s training record.
        </p>
      </div>
    </main>
  );
}

function WorkerTrainingContent() {
  const searchParams = useSearchParams();
  const workerApplicationId =
    searchParams.get("applicationId")?.trim() ??
    "";

  const program =
    smilingMonadSupportWorkerFoundationProgram;
  const modules = useMemo(
    () => getProgramModules(program.id),
    [program.id],
  );

  const [trainingRecord, setTrainingRecord] =
    useState<TrainingRecord | null>(null);
  const [message, setMessage] =
    useState<string>("");

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

  function startTraining() {
    if (!workerApplicationId) {
      setMessage(
        "Open this page from your worker application so the training can be linked to you.",
      );
      return;
    }

    const record =
      enrolWorkerInTrainingProgram(
        workerApplicationId,
        program.id,
        program.version,
        modules,
      );

    setTrainingRecord(record);
    setMessage(
      "Your training record has been created.",
    );
  }

  if (!workerApplicationId) {
    return (
      <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
            Smiling Monad School
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Worker Training
          </h1>

          <p className="mt-4 leading-7 text-black/70">
            This training page must be opened
            from a worker application. That keeps
            every learning section, assessment
            attempt and reviewer decision attached
            to the correct worker.
          </p>

          <Link
            href="/school"
            className="mt-7 inline-flex rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
          >
            Return to the School
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4efe5] px-5 py-8 text-[#2c2a26]">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
              Smiling Monad School
            </p>

            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              {program.title}
            </h1>
          </div>

          <Link
            href="/school"
            className="rounded-full border border-black/15 bg-white/70 px-5 py-3 text-sm font-semibold"
          >
            Back to School
          </Link>
        </div>

        <section className="mt-7 rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-black/50">
                Program version {program.version}
              </p>

              <p className="mt-3 leading-7 text-black/70">
                {program.description}
              </p>

              <p className="mt-3 text-sm leading-6 text-black/55">
                The program is currently marked as
                draft while its content and
                assessment instruments are reviewed.
              </p>
            </div>

            {!trainingRecord ? (
              <button
                type="button"
                onClick={startTraining}
                className="rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
              >
                Start training
              </button>
            ) : (
              <div className="rounded-full bg-[#e8f0df] px-4 py-2 text-sm font-semibold text-[#34452d]">
                Training record active
              </div>
            )}
          </div>

          {message ? (
            <p className="mt-5 rounded-2xl bg-black/5 px-4 py-3 text-sm">
              {message}
            </p>
          ) : null}
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">
              Learning modules
            </h2>

            <p className="mt-2 text-black/60">
              Complete the learning, assessments
              and human review requirements in
              order.
            </p>
          </div>

          <div className="grid gap-5">
            {modules.map((module) => {
              const attempt =
                trainingRecord?.moduleAttempts.find(
                  (candidate) =>
                    candidate.moduleId ===
                    module.id,
                );

              const progress = attempt
                ? calculateSectionProgress(
                    attempt,
                  )
                : 0;

              const available =
                Boolean(trainingRecord);

              return (
                <article
                  key={module.id}
                  className="rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-black/55">
                          {module.code}
                        </span>

                        <span className="text-sm text-black/45">
                          Version {module.version}
                        </span>

                        <span className="text-sm text-black/45">
                          About {module.estimatedMinutes} minutes
                        </span>
                      </div>

                      <h3 className="mt-4 text-2xl font-semibold">
                        {module.title}
                      </h3>

                      <p className="mt-3 leading-7 text-black/65">
                        {module.purpose}
                      </p>
                    </div>

                    <div className="min-w-40 text-right">
                      <p className="text-sm font-semibold">
                        {attempt
                          ? formatStatus(
                              attempt.status,
                            )
                          : "Locked"}
                      </p>

                      <p className="mt-1 text-sm text-black/50">
                        {progress}% learning complete
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-[#596b4d] transition-all"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-black/55">
                      {module.sections.length} required
                      learning sections · Human review
                      required
                    </p>

                    {available ? (
                      <Link
                        href={`/school/workers/training/${module.id}?applicationId=${encodeURIComponent(
                          workerApplicationId,
                        )}`}
                        className="rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
                      >
                        {attempt?.status ===
                        "not-started"
                          ? "Begin Module 1"
                          : "Continue Module 1"}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-full bg-black/10 px-5 py-3 text-sm font-semibold text-black/35"
                      >
                        Start program first
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function WorkerTrainingPage() {
  return (
    <Suspense fallback={<TrainingPageFallback />}>
      <WorkerTrainingContent />
    </Suspense>
  );
}