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
  createTrainingInvitation,
  getCircleTrainingInvitations,
  getParticipantTrainingInvitationSummary,
  sendTrainingInvitation,
  subscribeToTrainingInvitations,
  type ParticipantTrainingInvitation,
  type RequestedWorkerRole,
} from "@/lib/training/invitations";
import {
  smilingMonadSupportWorkerFoundationProgram,
  trainingModules,
} from "@/lib/training/programs";

const roleOptions: Array<{
  value: RequestedWorkerRole;
  label: string;
}> = [
  {
    value: "support-worker",
    label: "Support worker",
  },
  {
    value: "community-access-worker",
    label: "Community access worker",
  },
  {
    value: "personal-care-worker",
    label: "Personal care worker",
  },
  {
    value: "domestic-support-worker",
    label: "Domestic support worker",
  },
  {
    value: "transport-support-worker",
    label: "Transport support worker",
  },
  {
    value: "mentor",
    label: "Mentor",
  },
  {
    value: "respite-worker",
    label: "Respite worker",
  },
  {
    value: "other",
    label: "Other",
  },
];

function InvitationPageFallback() {
  return (
    <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
          Circle of Support
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Loading training invitations
        </h1>
      </div>
    </main>
  );
}

function TrainingInvitationsContent() {
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

  const [invitations, setInvitations] =
    useState<ParticipantTrainingInvitation[]>(
      [],
    );

  const [workerDisplayName, setWorkerDisplayName] =
    useState("");
  const [workerEmail, setWorkerEmail] =
    useState("");
  const [requestedRole, setRequestedRole] =
    useState<RequestedWorkerRole>(
      "support-worker",
    );
  const [customRoleTitle, setCustomRoleTitle] =
    useState("");
  const [roleDescription, setRoleDescription] =
    useState("");
  const [participantReason, setParticipantReason] =
    useState("");
  const [participantMessage, setParticipantMessage] =
    useState("");
  const [message, setMessage] =
    useState("");

  const program =
    smilingMonadSupportWorkerFoundationProgram;

  const requiredModuleIds = useMemo(
    () =>
      trainingModules.map(
        (module) => module.id,
      ),
    [],
  );

  useEffect(() => {
    const refresh = () => {
      setInvitations(
        getCircleTrainingInvitations(
          circleId,
        ),
      );
    };

    refresh();

    return subscribeToTrainingInvitations(
      refresh,
    );
  }, [circleId]);

  function resetForm() {
    setWorkerDisplayName("");
    setWorkerEmail("");
    setRequestedRole(
      "support-worker",
    );
    setCustomRoleTitle("");
    setRoleDescription("");
    setParticipantReason("");
    setParticipantMessage("");
  }

  function createAndSendInvitation() {
    try {
      const invitation =
        createTrainingInvitation({
          circleId,
          participantId,
          participantDisplayName,
          workerEmail,
          workerDisplayName,
          requestedRole,
          customRoleTitle,
          roleDescription,
          trainingProgramId:
            program.id,
          trainingProgramVersion:
            program.version,
          requiredModuleIds,
          participantMessage,
          participantReason,
          expiresInDays: 30,
        });

      sendTrainingInvitation(
        invitation.id,
      );

      setMessage(
        `Training invitation sent to ${invitation.workerDisplayName}.`,
      );

      resetForm();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create the training invitation.",
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
              Invite a worker to train
            </h1>

            <p className="mt-3 leading-7 text-black/65">
              Ask a worker you already know or
              would like to work with to complete
              the Smiling Monad training pathway.
              You can see what the training covers
              and follow their progress without
              seeing private evidence or reviewer
              notes.
            </p>
          </div>

          <Link
            href="/circle"
            className="rounded-full border border-black/15 bg-white/70 px-5 py-3 text-sm font-semibold"
          >
            Back to Circle
          </Link>
        </header>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
          <section className="rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              New training invitation
            </h2>

            <p className="mt-2 text-sm leading-6 text-black/55">
              This invitation will be linked to
              your Circle and the role you are
              asking the worker to perform.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">
                  Worker name
                </span>

                <input
                  value={workerDisplayName}
                  onChange={(event) =>
                    setWorkerDisplayName(
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                  placeholder="Worker's name"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold">
                  Worker email
                </span>

                <input
                  type="email"
                  value={workerEmail}
                  onChange={(event) =>
                    setWorkerEmail(
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                  placeholder="worker@example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold">
                  Requested role
                </span>

                <select
                  value={requestedRole}
                  onChange={(event) =>
                    setRequestedRole(
                      event.target
                        .value as RequestedWorkerRole,
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                >
                  {roleOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              {requestedRole === "other" ? (
                <label className="block">
                  <span className="text-sm font-semibold">
                    Custom role title
                  </span>

                  <input
                    value={customRoleTitle}
                    onChange={(event) =>
                      setCustomRoleTitle(
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                    placeholder="Describe the role"
                  />
                </label>
              ) : null}
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold">
                What would this worker do in
                your Circle?
              </span>

              <textarea
                value={roleDescription}
                onChange={(event) =>
                  setRoleDescription(
                    event.target.value,
                  )
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                placeholder="Describe the support, responsibilities and boundaries of the role."
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold">
                Why are you asking them to
                complete the training?
              </span>

              <textarea
                value={participantReason}
                onChange={(event) =>
                  setParticipantReason(
                    event.target.value,
                  )
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                placeholder="Explain what would help you feel confident and safe."
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold">
                Personal message
              </span>

              <textarea
                value={participantMessage}
                onChange={(event) =>
                  setParticipantMessage(
                    event.target.value,
                  )
                }
                rows={3}
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                placeholder="Optional message to the worker."
              />
            </label>

            <div className="mt-6 rounded-3xl border border-[#b8c7a8] bg-[#eef3e8] p-5">
              <h3 className="font-semibold">
                What the worker is being asked
                to complete
              </h3>

              <p className="mt-2 text-sm leading-6 text-black/60">
                {program.title}, version{" "}
                {program.version}
              </p>

              <ul className="mt-4 space-y-2 text-sm text-black/65">
                {trainingModules.map(
                  (module) => (
                    <li
                      key={module.id}
                      className="rounded-2xl bg-white/60 px-4 py-3"
                    >
                      <strong>
                        {module.title}
                      </strong>
                      <span className="mt-1 block">
                        {module.purpose}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <button
              type="button"
              onClick={
                createAndSendInvitation
              }
              className="mt-6 rounded-full bg-[#2c2a26] px-6 py-3 text-sm font-semibold text-white"
            >
              Send training invitation
            </button>

            {message ? (
              <p className="mt-5 rounded-2xl bg-black/5 px-4 py-3 text-sm">
                {message}
              </p>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold">
              Circle invitations
            </h2>

            <p className="mt-2 text-sm leading-6 text-black/55">
              Participant-safe progress only.
              Private evidence and reviewer notes
              stay hidden.
            </p>

            <div className="mt-6 space-y-4">
              {invitations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-black/15 bg-white/50 p-5">
                  <p className="text-sm leading-6 text-black/55">
                    No training invitations have
                    been sent from this Circle yet.
                  </p>
                </div>
              ) : (
                invitations.map(
                  (invitation) => {
                    const summary =
                      getParticipantTrainingInvitationSummary(
                        invitation,
                      );

                    return (
                      <article
                        key={invitation.id}
                        className="rounded-3xl border border-black/10 bg-white/65 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">
                              {
                                summary.workerDisplayName
                              }
                            </h3>

                            <p className="mt-1 text-sm text-black/55">
                              {
                                summary.requestedRoleLabel
                              }
                            </p>
                          </div>

                          <span className="rounded-full bg-[#eef3e8] px-3 py-1 text-xs font-semibold text-[#34452d]">
                            {
                              summary.progressLabel
                            }
                          </span>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-black/60">
                          {
                            invitation.roleDescription
                          }
                        </p>

                        <p className="mt-3 text-xs text-black/40">
                          Updated{" "}
                          {new Date(
                            summary.updatedAt,
                          ).toLocaleString()}
                        </p>
                      </article>
                    );
                  },
                )
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function CircleTrainingInvitationsPage() {
  return (
    <Suspense
      fallback={
        <InvitationPageFallback />
      }
    >
      <TrainingInvitationsContent />
    </Suspense>
  );
}