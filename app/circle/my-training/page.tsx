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
  activateParticipantSpecificModule,
  createParticipantSpecificModule,
  getActiveCircleModule,
  readParticipantSpecificModules,
  subscribeToCircleTraining,
  type CircleTrainingAudience,
  type ParticipantSpecificTrainingModule,
} from "@/lib/training/circle-modules";

const audienceOptions: Array<{
  value: CircleTrainingAudience;
  label: string;
}> = [
  {
    value: "worker",
    label: "Support workers",
  },
  {
    value: "provider",
    label: "Providers",
  },
  {
    value: "support-coordinator",
    label: "Support coordinators",
  },
  {
    value: "therapist",
    label: "Therapists",
  },
  {
    value: "family-member",
    label: "Family members",
  },
  {
    value: "other-circle-member",
    label: "Other Circle members",
  },
];

function PageFallback() {
  return (
    <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
          Circle of Support
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Loading your Circle training module
        </h1>
      </div>
    </main>
  );
}

function audienceLabel(
  audience: CircleTrainingAudience,
): string {
  return (
    audienceOptions.find(
      (option) =>
        option.value === audience,
    )?.label ?? audience
  );
}

function ParticipantCircleTrainingContent() {
  const searchParams = useSearchParams();

  const circleId =
    searchParams.get("circleId")?.trim() ||
    "primary-circle";

  const participantId =
    searchParams.get("participantId")?.trim() ||
    "participant";

  const participantDisplayName =
    searchParams
      .get("participantName")
      ?.trim() || "Participant";

  const [modules, setModules] = useState<
    ParticipantSpecificTrainingModule[]
  >([]);

  const [title, setTitle] = useState(
    `Working With ${participantDisplayName}`,
  );
  const [purpose, setPurpose] = useState("");
  const [
    participantIntroduction,
    setParticipantIntroduction,
  ] = useState("");
  const [
    communicationInformation,
    setCommunicationInformation,
  ] = useState("");
  const [
    importantRoutines,
    setImportantRoutines,
  ] = useState("");
  const [
    preferencesAndChoices,
    setPreferencesAndChoices,
  ] = useState("");
  const [
    safetyAndSupportInformation,
    setSafetyAndSupportInformation,
  ] = useState("");
  const [
    boundariesAndExpectations,
    setBoundariesAndExpectations,
  ] = useState("");
  const [
    selectedAudiences,
    setSelectedAudiences,
  ] = useState<CircleTrainingAudience[]>(
    audienceOptions.map(
      (option) => option.value,
    ),
  );
  const [
    participantApprovalRequired,
    setParticipantApprovalRequired,
  ] = useState(true);
  const [
    humanReviewRequired,
    setHumanReviewRequired,
  ] = useState(false);
  const [renewalMonths, setRenewalMonths] =
    useState("12");
  const [message, setMessage] =
    useState("");

  useEffect(() => {
    const refresh = () => {
      setModules(
        readParticipantSpecificModules().filter(
          (module) =>
            module.circleId === circleId,
        ),
      );
    };

    refresh();

    return subscribeToCircleTraining(
      refresh,
    );
  }, [circleId]);

  const activeModule = useMemo(
    () =>
      getActiveCircleModule(circleId),
    [circleId, modules],
  );

  function toggleAudience(
    audience: CircleTrainingAudience,
    checked: boolean,
  ) {
    setSelectedAudiences((current) =>
      checked
        ? [
            ...new Set([
              ...current,
              audience,
            ]),
          ]
        : current.filter(
            (item) => item !== audience,
          ),
    );
  }

  function createModule() {
    try {
      const module =
        createParticipantSpecificModule({
          circleId,
          participantId,
          participantDisplayName,
          title,
          purpose,
          participantIntroduction,
          requiredAudiences:
            selectedAudiences,
          communicationInformation,
          importantRoutines,
          preferencesAndChoices,
          safetyAndSupportInformation,
          boundariesAndExpectations,
          participantApprovalRequired,
          humanReviewRequired,
          renewalMonths:
            renewalMonths.trim() === ""
              ? null
              : Number(
                  renewalMonths,
                ),
        });

      setMessage(
        `Draft module “${module.title}” created. Review it below, then activate it when you are ready.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create the participant-specific module.",
      );
    }
  }

  function activateModule(
    moduleId: string,
  ) {
    try {
      const module =
        activateParticipantSpecificModule(
          moduleId,
        );

      setMessage(
        `“${module.title}” is now mandatory for the selected Circle member types.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to activate this module.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f4efe5] px-4 py-7 text-[#2c2a26] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
              Circle of Support
            </p>

            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Create my mandatory Circle module
            </h1>

            <p className="mt-3 leading-7 text-black/65">
              Create a short training module about
              you. Every selected worker, provider
              or other Circle member must complete
              it before joining your Circle,
              whether or not they complete the main
              Smiling Monad training package.
            </p>
          </div>

          <Link
            href="/circle"
            className="rounded-full border border-black/15 bg-white/70 px-5 py-3 text-sm font-semibold"
          >
            Back to Circle
          </Link>
        </header>

        {activeModule ? (
          <section className="mt-7 rounded-[2rem] border border-[#b8c7a8] bg-[#eef3e8] p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#44553a]">
              Active mandatory module
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              {activeModule.title}
            </h2>

            <p className="mt-3 leading-7 text-black/65">
              {activeModule.purpose}
            </p>

            <p className="mt-4 text-sm text-black/55">
              Version {activeModule.version} ·
              Required for{" "}
              {activeModule.requiredAudiences
                .map(audienceLabel)
                .join(", ")}
            </p>
          </section>
        ) : null}

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <section className="rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              Build the module
            </h2>

            <p className="mt-2 text-sm leading-6 text-black/55">
              Use your own words. Kimi can later
              help organise the information, but
              the meaning must remain yours.
            </p>

            <label className="mt-6 block">
              <span className="text-sm font-semibold">
                Module title
              </span>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold">
                Why this module matters
              </span>

              <textarea
                value={purpose}
                onChange={(event) =>
                  setPurpose(
                    event.target.value,
                  )
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                placeholder="Explain what you want Circle members to understand before supporting or working with you."
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold">
                A message from me
              </span>

              <textarea
                value={
                  participantIntroduction
                }
                onChange={(event) =>
                  setParticipantIntroduction(
                    event.target.value,
                  )
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                placeholder="Introduce yourself in the way you want new Circle members to know you."
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold">
                How I communicate
              </span>

              <textarea
                value={
                  communicationInformation
                }
                onChange={(event) =>
                  setCommunicationInformation(
                    event.target.value,
                  )
                }
                rows={5}
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                placeholder="Include speech, gestures, visuals, devices, behaviour, processing time, signs of yes or no, and how people should check understanding."
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold">
                My important routines
              </span>

              <textarea
                value={importantRoutines}
                onChange={(event) =>
                  setImportantRoutines(
                    event.target.value,
                  )
                }
                rows={5}
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                placeholder="Describe routines that help your day feel predictable, comfortable or successful."
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold">
                My preferences and choices
              </span>

              <textarea
                value={
                  preferencesAndChoices
                }
                onChange={(event) =>
                  setPreferencesAndChoices(
                    event.target.value,
                  )
                }
                rows={5}
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                placeholder="Explain what you enjoy, what you do not want, how choices should be offered, and what matters most to you."
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold">
                What helps me feel safe and
                supported
              </span>

              <textarea
                value={
                  safetyAndSupportInformation
                }
                onChange={(event) =>
                  setSafetyAndSupportInformation(
                    event.target.value,
                  )
                }
                rows={5}
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                placeholder="Describe signs of distress, helpful responses, important risks, and who should be contacted when support is needed."
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold">
                My Circle expectations and
                boundaries
              </span>

              <textarea
                value={
                  boundariesAndExpectations
                }
                onChange={(event) =>
                  setBoundariesAndExpectations(
                    event.target.value,
                  )
                }
                rows={5}
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                placeholder="Explain how people should communicate, respect privacy, handle disagreements and behave as part of your Circle."
              />
            </label>

            <div className="mt-6 rounded-3xl border border-black/10 bg-[#f7f3eb] p-5">
              <h3 className="font-semibold">
                Who must complete it?
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {audienceOptions.map(
                  (option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAudiences.includes(
                          option.value,
                        )}
                        onChange={(event) =>
                          toggleAudience(
                            option.value,
                            event.target
                              .checked,
                          )
                        }
                        className="mt-1"
                      />

                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                    </label>
                  ),
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-black/10 bg-white p-5">
                <input
                  type="checkbox"
                  checked={
                    participantApprovalRequired
                  }
                  onChange={(event) =>
                    setParticipantApprovalRequired(
                      event.target.checked,
                    )
                  }
                  className="mt-1"
                />

                <span>
                  <strong className="block">
                    My approval required
                  </strong>

                  <span className="mt-1 block text-sm leading-6 text-black/55">
                    Completion is not final until
                    you approve the person’s
                    responses.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-black/10 bg-white p-5">
                <input
                  type="checkbox"
                  checked={humanReviewRequired}
                  onChange={(event) =>
                    setHumanReviewRequired(
                      event.target.checked,
                    )
                  }
                  className="mt-1"
                />

                <span>
                  <strong className="block">
                    Additional reviewer required
                  </strong>

                  <span className="mt-1 block text-sm leading-6 text-black/55">
                    Adds a formal reviewer decision
                    as well as your approval.
                  </span>
                </span>
              </label>
            </div>

            <label className="mt-5 block max-w-xs">
              <span className="text-sm font-semibold">
                Renewal period in months
              </span>

              <input
                type="number"
                min="1"
                max="36"
                value={renewalMonths}
                onChange={(event) =>
                  setRenewalMonths(
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
              />
            </label>

            <button
              type="button"
              onClick={createModule}
              disabled={Boolean(activeModule)}
              className="mt-7 rounded-full bg-[#2c2a26] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-black/20"
            >
              Create draft module
            </button>

            {activeModule ? (
              <p className="mt-3 text-sm text-black/50">
                Retire or update the active module
                before creating a new version.
              </p>
            ) : null}

            {message ? (
              <p className="mt-5 rounded-2xl bg-black/5 px-4 py-3 text-sm">
                {message}
              </p>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              Module versions
            </h2>

            <p className="mt-2 text-sm leading-6 text-black/55">
              Only one version can be active for
              a Circle at a time.
            </p>

            <div className="mt-6 space-y-4">
              {modules.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-black/15 bg-white/50 p-5">
                  <p className="text-sm leading-6 text-black/55">
                    You have not created a
                    participant-specific module
                    yet.
                  </p>
                </div>
              ) : (
                modules
                  .slice()
                  .sort(
                    (left, right) =>
                      Date.parse(
                        right.updatedAt,
                      ) -
                      Date.parse(
                        left.updatedAt,
                      ),
                  )
                  .map((module) => (
                    <article
                      key={module.id}
                      className="rounded-3xl border border-black/10 bg-white/65 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">
                            {module.title}
                          </h3>

                          <p className="mt-1 text-sm text-black/50">
                            Version{" "}
                            {module.version}
                          </p>
                        </div>

                        <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/50">
                          {module.status}
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-black/60">
                        {module.purpose}
                      </p>

                      <p className="mt-3 text-xs leading-5 text-black/45">
                        Required for{" "}
                        {module.requiredAudiences
                          .map(
                            audienceLabel,
                          )
                          .join(", ")}
                      </p>

                      {module.status ===
                      "draft" ? (
                        <button
                          type="button"
                          onClick={() =>
                            activateModule(
                              module.id,
                            )
                          }
                          className="mt-5 rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
                        >
                          Activate mandatory
                          module
                        </button>
                      ) : null}
                    </article>
                  ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function ParticipantCircleTrainingPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <ParticipantCircleTrainingContent />
    </Suspense>
  );
}