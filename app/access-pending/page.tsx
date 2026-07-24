"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  listMySecureCircles,
} from "@/lib/circle/secure-circle-directory-client";
import {
  acceptSecureCircleInvitation,
  declineSecureCircleInvitation,
  readMySecureCircleInvitations,
  type SecureCircleInvitation,
} from "@/lib/circle/secure-invitations-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AccessStatus =
  | "pending"
  | "approved"
  | "suspended"
  | "unknown";

type InvitationAction =
  | "accept"
  | "decline";

type WorkingInvitation = {
  id: string;
  action: InvitationAction;
} | null;

function describeRole(
  role: SecureCircleInvitation["role"],
): string {
  return role
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function describeUnknownError(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

function alreadyBelongsToCircle(
  message: string,
): boolean {
  const normalised =
    message.toLowerCase();

  return (
    normalised.includes(
      "already belongs",
    ) ||
    normalised.includes(
      "already a member",
    ) ||
    normalised.includes(
      "already active",
    )
  );
}

export default function AccessPendingPage() {
  const [status, setStatus] =
    useState<AccessStatus>("unknown");

  const [email, setEmail] =
    useState("");

  const [invitations, setInvitations] =
    useState<SecureCircleInvitation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    workingInvitation,
    setWorkingInvitation,
  ] = useState<WorkingInvitation>(
    null,
  );

  const [message, setMessage] =
    useState("");

  const loadAccess = useCallback(
    async () => {
      setLoading(true);
      setMessage("");

      try {
        const supabase =
          getSupabaseBrowserClient();

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError || !user) {
          window.location.replace(
            "/sign-in?returnTo=%2Faccess-pending",
          );
          return;
        }

        setEmail(user.email ?? "");

        const {
          data: accessRecord,
          error: accessError,
        } = await supabase
          .from("user_access")
          .select("access_status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (accessError) {
          throw new Error(
            accessError.message,
          );
        }

        const nextStatus =
          accessRecord?.access_status;

        if (
          nextStatus === "approved" ||
          nextStatus === "pending" ||
          nextStatus === "suspended"
        ) {
          setStatus(nextStatus);
        } else {
          setStatus("pending");
        }

        const secureInvitations =
          await readMySecureCircleInvitations();

        let activeCircleIds =
          new Set<string>();

        try {
          const directoryEntries =
            await listMySecureCircles();

          activeCircleIds =
            new Set(
              directoryEntries
                .filter(
                  (entry) =>
                    entry.membership
                      .membership_status ===
                    "active",
                )
                .map(
                  (entry) =>
                    entry.circle.id,
                ),
            );
        } catch {
          // Invitation access remains usable while
          // the Circle directory is unavailable.
        }

        setInvitations(
          secureInvitations.filter(
            (invitation) =>
              invitation.membership_status ===
                "invited" &&
              !activeCircleIds.has(
                invitation.circle_id,
              ),
          ),
        );
      } catch (error) {
        setStatus("unknown");

        setMessage(
          describeUnknownError(
            error,
            "Access could not be checked.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadAccess();
  }, [loadAccess]);

  async function respondToInvitation(
    invitationId: string,
    action: InvitationAction,
  ) {
    if (workingInvitation) {
      return;
    }

    setWorkingInvitation({
      id: invitationId,
      action,
    });
    setMessage("");

    try {
      if (action === "accept") {
        await acceptSecureCircleInvitation(
          invitationId,
        );
      } else {
        await declineSecureCircleInvitation(
          invitationId,
        );
      }

      setInvitations((current) =>
        current.filter(
          (invitation) =>
            invitation.id !==
            invitationId,
        ),
      );

      setMessage(
        action === "accept"
          ? "Invitation accepted. The Circle is now available in the Circle Centre."
          : "Invitation declined.",
      );
    } catch (error) {
      const errorMessage =
        describeUnknownError(
          error,
          action === "accept"
            ? "The Circle invitation could not be accepted."
            : "The Circle invitation could not be declined.",
        );

      if (
        action === "accept" &&
        alreadyBelongsToCircle(
          errorMessage,
        )
      ) {
        setInvitations((current) =>
          current.filter(
            (invitation) =>
              invitation.id !==
              invitationId,
          ),
        );

        setMessage(
          "You already belong to this Circle. It is available in the Circle Centre.",
        );
      } else {
        setMessage(errorMessage);
      }
    } finally {
      setWorkingInvitation(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 text-[#2c2a26]">
        <div className="rounded-3xl border border-black/10 bg-white/80 px-7 py-6 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/45">
            Smiling Monad
          </p>

          <p className="mt-3 text-lg font-semibold">
            Checking your account…
          </p>
        </div>
      </main>
    );
  }

  const showInvitations =
    status !== "suspended" &&
    (
      invitations.length > 0 ||
      status !== "approved"
    );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="w-full max-w-2xl rounded-[2rem] border border-black/10 bg-white/85 p-7 shadow-sm sm:p-9">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/45">
            Smiling Monad
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            {status === "suspended"
              ? "Access paused"
              : status === "approved"
                ? "Welcome home"
                : "Your account"}
          </h1>

          <p className="mt-4 leading-7 text-black/65">
            {status === "suspended"
              ? "Your access has been temporarily paused. Contact the Smiling Monad administrator for assistance."
              : status === "approved"
                ? "Your account is ready. Enter the Space to open your Office."
                : "Your account is awaiting approval. You can still respond to a Circle invitation below."}
          </p>

          {email ? (
            <p className="mt-5 break-all rounded-2xl bg-black/5 px-4 py-3 text-sm font-semibold">
              {email}
            </p>
          ) : null}
        </header>

        {showInvitations ? (
          <section className="mt-7">
            <h2 className="text-xl font-semibold">
              Circle invitations
            </h2>

            <p className="mt-2 text-sm leading-6 text-black/55">
              Only invitations that still need
              your response appear here.
            </p>

            <div className="mt-4 space-y-3">
              {invitations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-black/15 bg-white/60 p-5 text-sm leading-6 text-black/55">
                  No Circle invitations are
                  waiting for this account.
                </div>
              ) : (
                invitations.map(
                  (invitation) => {
                    const accepting =
                      workingInvitation?.id ===
                        invitation.id &&
                      workingInvitation.action ===
                        "accept";

                    const declining =
                      workingInvitation?.id ===
                        invitation.id &&
                      workingInvitation.action ===
                        "decline";

                    return (
                      <article
                        key={invitation.id}
                        className="rounded-3xl border border-black/10 bg-white p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-lg font-semibold">
                              {invitation.circle
                                ?.name ||
                                invitation.display_name ||
                                "Circle invitation"}
                            </p>

                            <p className="mt-1 text-sm text-black/55">
                              {describeRole(
                                invitation.role,
                              )}

                              {invitation.relationship
                                ? ` · ${invitation.relationship}`
                                : ""}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                void respondToInvitation(
                                  invitation.id,
                                  "accept",
                                );
                              }}
                              disabled={Boolean(
                                workingInvitation,
                              )}
                              className="rounded-full bg-[#60432f] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {accepting
                                ? "Accepting…"
                                : "Accept"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                void respondToInvitation(
                                  invitation.id,
                                  "decline",
                                );
                              }}
                              disabled={Boolean(
                                workingInvitation,
                              )}
                              className="rounded-full border border-[#60432f]/25 bg-white px-5 py-3 text-sm font-semibold text-[#60432f] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {declining
                                ? "Declining…"
                                : "Decline"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  },
                )
              )}
            </div>
          </section>
        ) : null}

        {message ? (
          <p className="mt-6 rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm leading-6">
            {message}
          </p>
        ) : null}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {status === "approved" ? (
            <Link
              href="/office"
              className="rounded-full bg-[#2c2a26] px-5 py-3 text-center text-sm font-semibold text-white"
            >
              Enter the Space — Office
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                void loadAccess();
              }}
              className="rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
            >
              Check access again
            </button>
          )}

          <Link
            href="/sign-out"
            className="rounded-full border border-black/15 bg-white px-5 py-3 text-center text-sm font-semibold"
          >
            Sign out
          </Link>
        </div>
      </div>
    </main>
  );
}