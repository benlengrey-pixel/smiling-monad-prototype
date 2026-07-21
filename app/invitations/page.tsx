"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  acceptSecureCircleInvitation,
  declineSecureCircleInvitation,
  readMySecureCircleInvitations,
  type SecureCircleInvitation,
} from "@/lib/circle/secure-invitations-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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

export default function InvitationsPage() {
  const [email, setEmail] = useState("");
  const [invitations, setInvitations] =
    useState<SecureCircleInvitation[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [workingId, setWorkingId] =
    useState("");
  const [message, setMessage] =
    useState("");

  const loadInvitations = useCallback(
    async () => {
      setLoading(true);
      setMessage("");

      try {
        const supabase =
          getSupabaseBrowserClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          window.location.replace(
            "/sign-in?returnTo=%2Finvitations",
          );
          return;
        }

        setEmail(user.email ?? "");

        const results =
          await readMySecureCircleInvitations();

        setInvitations(results);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Circle invitations could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  async function respondToInvitation(
    invitationId: string,
    response: "accept" | "decline",
  ) {
    if (workingId) {
      return;
    }

    setWorkingId(invitationId);
    setMessage("");

    try {
      if (response === "accept") {
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
            invitation.id !== invitationId,
        ),
      );

      setMessage(
        response === "accept"
          ? "Invitation accepted. You are now a member of this Circle."
          : "Invitation declined.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : response === "accept"
            ? "The invitation could not be accepted."
            : "The invitation could not be declined.",
      );
    } finally {
      setWorkingId("");
    }
  }

  return (
    <main className="min-h-[100svh] bg-[#f4efe5] px-5 py-8 text-[#2c2a26]">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/connections"
            aria-label="Return to the Connections Centre"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-xl"
          >
            ←
          </Link>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
              Circle of Support
            </p>

            <h1 className="mt-1 text-2xl font-semibold">
              Invitations
            </h1>
          </div>

          <Link
            href="/office"
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold"
          >
            Space
          </Link>
        </header>

        <section className="mt-8 rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-sm sm:p-8">
          <p className="leading-7 text-black/60">
            Invitations sent to your signed-in email
            address will appear here.
          </p>

          {email ? (
            <p className="mt-4 break-all rounded-2xl bg-black/5 px-4 py-3 text-sm font-semibold">
              {email}
            </p>
          ) : null}

          {loading ? (
            <p className="mt-6 rounded-2xl bg-black/5 px-4 py-4">
              Checking invitations…
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {invitations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-black/15 p-5">
                  <p className="font-semibold">
                    No invitations found
                  </p>

                  <p className="mt-2 text-sm leading-6 text-black/55">
                    Ask the Circle owner to confirm
                    that the invitation was sent to
                    the email address shown above.
                  </p>
                </div>
              ) : (
                invitations.map(
                  (invitation) => (
                    <article
                      key={invitation.id}
                      className="rounded-3xl border border-black/10 bg-white p-5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
                        Invitation to
                      </p>

                      <h2 className="mt-2 text-xl font-semibold">
                        {invitation.circle?.name ||
                          "Circle of Support"}
                      </h2>

                      {invitation.circle?.purpose ? (
                        <p className="mt-2 text-sm leading-6 text-black/55">
                          {invitation.circle.purpose}
                        </p>
                      ) : null}

                      <div className="mt-4 rounded-2xl bg-black/5 px-4 py-3">
                        <p className="font-semibold">
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

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            void respondToInvitation(
                              invitation.id,
                              "accept",
                            );
                          }}
                          disabled={Boolean(workingId)}
                          className="w-full rounded-full bg-[#60432f] px-5 py-3 font-semibold text-white disabled:opacity-50"
                        >
                          {workingId ===
                          invitation.id
                            ? "Working…"
                            : "Accept invitation"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            void respondToInvitation(
                              invitation.id,
                              "decline",
                            );
                          }}
                          disabled={Boolean(workingId)}
                          className="w-full rounded-full border border-black/15 bg-white px-5 py-3 font-semibold text-black/70 disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    </article>
                  ),
                )
              )}
            </div>
          )}

          {message ? (
            <p className="mt-6 rounded-2xl bg-black/5 px-4 py-3 text-sm leading-6">
              {message}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              void loadInvitations();
            }}
            disabled={loading}
            className="mt-6 w-full rounded-full border border-black/15 bg-white px-5 py-3 font-semibold disabled:opacity-50"
          >
            Check again
          </button>
        </section>
      </div>
    </main>
  );
}