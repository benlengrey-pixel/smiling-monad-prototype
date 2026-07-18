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
  acceptTrainingInvitation,
  declineTrainingInvitation,
  getWorkerTrainingInvitations,
  markTrainingInvitationViewed,
  subscribeToTrainingInvitations,
  type ParticipantTrainingInvitation,
} from "@/lib/training/invitations";
import {
  getProgramModules,
  smilingMonadSupportWorkerFoundationProgram,
} from "@/lib/training/programs";

function WorkerInvitationsFallback() {
  return (
    <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
          Smiling Monad School
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Loading training invitations
        </h1>
      </div>
    </main>
  );
}

function formatRole(
  invitation: ParticipantTrainingInvitation,
): string {
  if (
    invitation.requestedRole === "other"
  ) {
    return (
      invitation.customRoleTitle ||
      "Custom support role"
    );
  }

  return invitation.requestedRole
    .split("-")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function statusLabel(
  invitation: ParticipantTrainingInvitation,
): string {
  switch (invitation.status) {
    case "sent":
      return "New invitation";
    case "viewed":
      return "Viewed";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "training-started":
      return "Training started";
    case "assessment-submitted":
      return "Assessment submitted";
    case "under-review":
      return "Under review";
    case "changes-requested":
      return "Changes requested";
    case "approved":
      return "Approved";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Cancelled";
    default:
      return invitation.status;
  }
}

function WorkerTrainingInvitationsContent() {
  const searchParams = useSearchParams();

  const workerEmail =
    searchParams.get("workerEmail")?.trim() ??
    "";

  const workerId =
    searchParams.get("workerId")?.trim() ??
    "";

  const workerApplicationId =
    searchParams
      .get("applicationId")
      ?.trim() ?? "";

  const [invitations, setInvitations] =
    useState<ParticipantTrainingInvitation[]>(
      [],
    );

  const [message, setMessage] =
    useState("");

  const program =
    smilingMonadSupportWorkerFoundationProgram;

  const programModules = useMemo(
    () => getProgramModules(program.id),
    [program.id],
  );

  useEffect(() => {
    if (!workerEmail) {
      setInvitations([]);
      return;
    }

    const refresh = () => {
      const matching =
        getWorkerTrainingInvitations(
          workerEmail,
        );

      setInvitations(matching);

      for (const invitation of matching) {
        if (invitation.status === "sent") {
          markTrainingInvitationViewed(
            invitation.id,
          );
        }
      }
    };

    refresh();

    return subscribeToTrainingInvitations(
      refresh,
    );
  }, [workerEmail]);

  function acceptInvitation(
    invitationId: string,
  ) {
    if (
      !workerId ||
      !workerApplicationId
    ) {
      setMessage(
        "Open this page from your worker application before accepting an invitation.",
      );
      return;
    }

    try {
      acceptTrainingInvitation({
        invitationId,
        workerId,
        workerApplicationId,
      });

      setMessage(
        "Invitation accepted. You can now begin the requested training.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to accept the invitation.",
      );
    }
  }

  function declineInvitation(
    invitationId: string,
  ) {
    try {
      declineTrainingInvitation(
        invitationId,
      );

      setMessage(
        "Invitation declined.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to decline the invitation.",
      );
    }
  }

  if (!workerEmail) {
    return (
      <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
            Smiling Monad School
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Worker training invitations
          </h1>

          <p className="mt-4 leading-7 text-black/70">
            Open this page from your worker
            application so invitations can be
            matched securely to your email and
            training record.
          </p>

          <Link
            href="/school"
            className="mt-7 inline-flex rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
          >
            Return to School
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4efe5] px-4 py-7 text-[#2c2a26] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
              Smiling Monad School
            </p>

            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Your training invitations
            </h1>

            <p className="mt-3 leading-7 text-black/65">
              Participants may invite you to
              complete Smiling Monad training for
              a particular role in their Circle of
              Support. You can review exactly what
              is being requested before accepting.
            </p>
          </div>

          <Link
            href="/school"
            className="rounded-full border border-black/15 bg-white/70 px-5 py-3 text-sm font-semibold"
          >
            Back to School
          </Link>
        </header>

        <section className="mt-7 rounded-[2rem] border border-[#b8c7a8] bg-[#eef3e8] p-6 sm:p-8">
          <h2 className="text-xl font-semibold">
            Training package
          </h2>

          <p className="mt-2 leading-7 text-black/65">
            {program.title}, version{" "}
            {program.version}
          </p>

          <div className="mt-5 grid gap-3">
            {programModules.map((module) => (
              <article
                key={module.id}
                className="rounded-3xl border border-black/10 bg-white/65 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/45">
                  {module.code}
                </p>

                <h3 className="mt-2 font-semibold">
                  {module.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-black/60">
                  {module.purpose}
                </p>

                <p className="mt-3 text-xs text-black/45">
                  {module.sections.length} learning
                  sections · Assessment and human
                  review required
                </p>
              </article>
            ))}
          </div>
        </section>

        {message ? (
          <p className="mt-6 rounded-2xl bg-black/5 px-4 py-3 text-sm">
            {message}
          </p>
        ) : null}

        <section className="mt-7">
          <h2 className="text-2xl font-semibold">
            Invitations
          </h2>

          <div className="mt-5 grid gap-5">
            {invitations.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/55 p-7">
                <p className="text-black/55">
                  No training invitations have
                  been sent to this worker email.
                </p>
              </div>
            ) : (
              invitations.map((invitation) => {
                const canRespond = [
                  "sent",
                  "viewed",
                ].includes(
                  invitation.status,
                );

                return (
                  <article
                    key={invitation.id}
                    className="rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-sm sm:p-8"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-black/45">
                          Invitation from{" "}
                          {
                            invitation.participantDisplayName
                          }
                        </p>

                        <h3 className="mt-2 text-2xl font-semibold">
                          {formatRole(
                            invitation,
                          )}
                        </h3>
                      </div>

                      <span className="rounded-full bg-[#eef3e8] px-4 py-2 text-xs font-semibold text-[#34452d]">
                        {statusLabel(
                          invitation,
                        )}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl border border-black/10 bg-white/65 p-5">
                        <h4 className="font-semibold">
                          Role in the Circle
                        </h4>

                        <p className="mt-2 text-sm leading-6 text-black/60">
                          {
                            invitation.roleDescription
                          }
                        </p>
                      </div>

                      <div className="rounded-3xl border border-black/10 bg-white/65 p-5">
                        <h4 className="font-semibold">
                          Why the participant is
                          requesting training
                        </h4>

                        <p className="mt-2 text-sm leading-6 text-black/60">
                          {
                            invitation.participantReason
                          }
                        </p>
                      </div>
                    </div>

                    {invitation.participantMessage ? (
                      <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 p-5">
                        <h4 className="font-semibold">
                          Personal message
                        </h4>

                        <p className="mt-2 leading-7 text-black/65">
                          {
                            invitation.participantMessage
                          }
                        </p>
                      </div>
                    ) : null}

                    {canRespond ? (
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            acceptInvitation(
                              invitation.id,
                            )
                          }
                          className="rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
                        >
                          Accept and begin training
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            declineInvitation(
                              invitation.id,
                            )
                          }
                          className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-semibold"
                        >
                          Decline invitation
                        </button>
                      </div>
                    ) : null}

                    {invitation.status ===
                    "accepted" ? (
                      <Link
                        href={`/school/workers/training?applicationId=${encodeURIComponent(
                          workerApplicationId,
                        )}`}
                        className="mt-6 inline-flex rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
                      >
                        Open training dashboard
                      </Link>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function WorkerTrainingInvitationsPage() {
  return (
    <Suspense
      fallback={
        <WorkerInvitationsFallback />
      }
    >
      <WorkerTrainingInvitationsContent />
    </Suspense>
  );
}