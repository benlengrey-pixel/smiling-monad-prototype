"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  acceptSecureCircleInvitation,
  readMySecureCircleInvitations,
  type SecureCircleInvitation,
} from "@/lib/circle/secure-invitations-client";
import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

type AccessStatus =
  | "pending"
  | "approved"
  | "suspended"
  | "unknown";

type SecurityStatus =
  | "checking"
  | "aal1"
  | "aal2"
  | "error";

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

export default function AccessPendingPage() {
  const [status, setStatus] =
    useState<AccessStatus>("unknown");

  const [securityStatus, setSecurityStatus] =
    useState<SecurityStatus>("checking");

  const [email, setEmail] =
    useState("");

  const [invitations, setInvitations] =
    useState<SecureCircleInvitation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [workingId, setWorkingId] =
    useState("");

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
          data: assurance,
          error: assuranceError,
        } =
          await supabase.auth.mfa
            .getAuthenticatorAssuranceLevel();

        if (assuranceError) {
          throw new Error(
            assuranceError.message,
          );
        }

        const currentSecurityStatus =
          assurance.currentLevel === "aal2"
            ? "aal2"
            : "aal1";

        setSecurityStatus(
          currentSecurityStatus,
        );

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

        if (
          currentSecurityStatus === "aal2"
        ) {
          const secureInvitations =
            await readMySecureCircleInvitations();

          setInvitations(
            secureInvitations,
          );
        } else {
          setInvitations([]);
        }
      } catch (error) {
        setSecurityStatus("error");
        setStatus("unknown");

        setMessage(
          error instanceof Error
            ? error.message
            : "Secure access could not be checked.",
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

  async function acceptInvitation(
    invitationId: string,
  ) {
    if (workingId) {
      return;
    }

    setWorkingId(invitationId);
    setMessage("");

    try {
      await acceptSecureCircleInvitation(
        invitationId,
      );

      setInvitations((current) =>
        current.filter(
          (invitation) =>
            invitation.id !==
            invitationId,
        ),
      );

      setMessage(
        "The Circle invitation has been accepted securely. Access will become available when your Smiling Monad account is approved.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The Circle invitation could not be accepted.",
      );
    } finally {
      setWorkingId("");
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
            Checking secure access…
          </p>
        </div>
      </main>
    );
  }

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
                ? "Access approved"
                : "Secure access"}
          </h1>

          <p className="mt-4 leading-7 text-black/65">
            {status === "suspended"
              ? "Your access has been temporarily paused. Contact the Smiling Monad administrator for assistance."
              : status === "approved"
                ? "Your account is approved. Two-step security is required before participant information can be opened."
                : "Complete two-step security, accept any Circle invitations sent to your email address, and wait for account approval."}
          </p>

          {email ? (
            <p className="mt-5 break-all rounded-2xl bg-black/5 px-4 py-3 text-sm font-semibold">
              {email}
            </p>
          ) : null}
        </header>

        <section className="mt-7 rounded-3xl border border-black/10 bg-[#f7f3eb] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold">
                Two-step security
              </p>

              <p className="mt-1 text-sm leading-6 text-black/55">
                {securityStatus === "aal2"
                  ? "Your current session has completed MFA."
                  : securityStatus === "aal1"
                    ? "An authenticator check is still required."
                    : "Security could not be confirmed."}
              </p>
            </div>

            {securityStatus === "aal2" ? (
              <span className="rounded-full bg-[#e3eddd] px-4 py-2 text-sm font-semibold text-[#405237]">
                Protected
              </span>
            ) : (
              <Link
                href="/security/mfa?returnTo=%2Faccess-pending"
                className="rounded-full bg-[#60432f] px-5 py-3 text-sm font-semibold text-white"
              >
                Set up or verify MFA
              </Link>
            )}
          </div>
        </section>

        {securityStatus === "aal2" ? (
          <section className="mt-6">
            <h2 className="text-xl font-semibold">
              Circle invitations
            </h2>

            <p className="mt-2 text-sm leading-6 text-black/55">
              Only invitations sent to your signed-in
              email address appear here.
            </p>

            <div className="mt-4 space-y-3">
              {invitations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-black/15 bg-white/60 p-5 text-sm leading-6 text-black/55">
                  No unclaimed Circle invitations were
                  found for this account.
                </div>
              ) : (
                invitations.map(
                  (invitation) => (
                    <article
                      key={invitation.id}
                      className="rounded-3xl border border-black/10 bg-white p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-lg font-semibold">
                            {invitation.display_name ||
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

                        <button
                          type="button"
                          onClick={() => {
                            void acceptInvitation(
                              invitation.id,
                            );
                          }}
                          disabled={Boolean(
                            workingId,
                          )}
                          className="rounded-full bg-[#60432f] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {workingId ===
                          invitation.id
                            ? "Accepting securely…"
                            : "Accept invitation"}
                        </button>
                      </div>
                    </article>
                  ),
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
          {status === "approved" &&
          securityStatus === "aal2" ? (
            <Link
              href="/office"
              className="rounded-full bg-[#2c2a26] px-5 py-3 text-center text-sm font-semibold text-white"
            >
              Enter the Space
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                void loadAccess();
              }}
              className="rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
            >
              Check again
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