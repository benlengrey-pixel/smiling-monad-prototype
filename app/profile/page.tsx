"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import RequireSignedInUser from "../../components/access/RequireSignedInUser";
import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";
import {
  readCurrentUserProfile,
  type SmilingMonadUserProfile,
  type SmilingMonadUserRole,
} from "@/lib/profile/user-profile-client";

const ROLE_OPTIONS: Array<{
  value: SmilingMonadUserRole;
  label: string;
}> = [
  {
    value: "participant",
    label: "Participant",
  },
  {
    value: "family",
    label: "Family member",
  },
  {
    value: "support-worker",
    label: "Support worker",
  },
  {
    value: "provider",
    label: "Provider",
  },
  {
    value: "professional",
    label: "Professional",
  },
  {
    value: "community-member",
    label: "Community member",
  },
  {
    value: "other",
    label: "Other",
  },
];

function ProfilePageContent() {
  const [profile, setProfile] =
    useState<SmilingMonadUserProfile | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    let active = true;

    readCurrentUserProfile()
      .then((currentProfile) => {
        if (!active) {
          return;
        }

        setProfile(currentProfile);
      })
      .catch(() => {
        if (active) {
          setMessage(
            "Your profile could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function saveProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!profile) {
      return;
    }

    if (!profile.displayName.trim()) {
      setMessage(
        "Enter the name you would like shown in the app.",
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const supabase =
        getSupabaseBrowserClient();

      const { data, error } =
        await supabase.auth.updateUser({
          data: {
            display_name:
              profile.displayName.trim(),
            role: profile.role,
            general_location:
              profile.generalLocation.trim(),
            about:
              profile.about.trim(),
            access_purpose:
              profile.accessPurpose.trim(),
            profile_completed: true,
            profile_updated_at:
              new Date().toISOString(),
          },
        });

      if (error) {
        throw error;
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              displayName:
                typeof data.user.user_metadata
                  .display_name === "string"
                  ? data.user.user_metadata
                      .display_name
                  : current.displayName,
              profileCompleted: true,
            }
          : current,
      );

      setMessage(
        "Your profile has been updated.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Your profile could not be saved.",
      );
    } finally {
      setSaving(false);
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
            Loading your profile…
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm">
          <h1 className="text-3xl font-semibold">
            Profile unavailable
          </h1>

          <p className="mt-4 leading-7 text-black/65">
            Sign in again to load your secure profile.
          </p>

          <Link
            href="/sign-in?returnTo=/profile"
            className="mt-6 inline-flex rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
          >
            Open sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm sm:p-9">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
            Smiling Monad
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Your profile
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-black/65">
            Update the personal information Kimi can use to understand and support you.
          </p>

          <div className="mt-6 rounded-3xl border border-black/10 bg-black/[0.03] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-black/45">
              Secure account
            </p>

            <p className="mt-2 break-all font-semibold">
              {profile.email}
            </p>
          </div>

          <form
            onSubmit={saveProfile}
            className="mt-6 space-y-5"
          >
            <label className="block">
              <span className="text-sm font-semibold">
                Name shown in the app
              </span>

              <input
                value={profile.displayName}
                onChange={(event) =>
                  setProfile((current) =>
                    current
                      ? {
                          ...current,
                          displayName:
                            event.target.value,
                        }
                      : current,
                  )
                }
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold">
                Your role
              </span>

              <select
                value={profile.role}
                onChange={(event) =>
                  setProfile((current) =>
                    current
                      ? {
                          ...current,
                          role:
                            event.target
                              .value as SmilingMonadUserRole,
                        }
                      : current,
                  )
                }
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
              >
                {ROLE_OPTIONS.map(
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

            <label className="block">
              <span className="text-sm font-semibold">
                General location
              </span>

              <input
                value={profile.generalLocation}
                onChange={(event) =>
                  setProfile((current) =>
                    current
                      ? {
                          ...current,
                          generalLocation:
                            event.target.value,
                        }
                      : current,
                  )
                }
                placeholder="Town or region"
                className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold">
                About you
              </span>

              <textarea
                value={profile.about}
                onChange={(event) =>
                  setProfile((current) =>
                    current
                      ? {
                          ...current,
                          about:
                            event.target.value,
                        }
                      : current,
                  )
                }
                className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-black/15 bg-white px-4 py-3 leading-7 outline-none focus:border-black/40"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold">
                What would you like help with?
              </span>

              <textarea
                value={profile.accessPurpose}
                onChange={(event) =>
                  setProfile((current) =>
                    current
                      ? {
                          ...current,
                          accessPurpose:
                            event.target.value,
                        }
                      : current,
                  )
                }
                className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-black/15 bg-white px-4 py-3 leading-7 outline-none focus:border-black/40"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-[#2c2a26] px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : "Save profile"}
            </button>
          </form>

          {message ? (
            <p className="mt-5 rounded-2xl bg-black/5 px-4 py-3 text-sm leading-6">
              {message}
            </p>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/office"
              className="rounded-full bg-[#2c2a26] px-5 py-3 text-center text-sm font-semibold text-white"
            >
              Return to the Space
            </Link>

            <Link
              href="/circle"
              className="rounded-full border border-black/15 bg-white px-5 py-3 text-center text-sm font-semibold"
            >
              Open Circle Centre
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <RequireSignedInUser>
      <ProfilePageContent />
    </RequireSignedInUser>
  );
}