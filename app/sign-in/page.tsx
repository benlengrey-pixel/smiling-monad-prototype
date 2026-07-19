"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

type ProfileRole =
  | "participant"
  | "family"
  | "support-worker"
  | "provider"
  | "professional"
  | "community-member"
  | "other";

type UserProfile = {
  displayName: string;
  role: ProfileRole;
  generalLocation: string;
  about: string;
  accessPurpose: string;
};

const EMPTY_PROFILE: UserProfile = {
  displayName: "",
  role: "community-member",
  generalLocation: "",
  about: "",
  accessPurpose: "",
};


function getSafeReturnTo(): string {
  if (typeof window === "undefined") {
    return "/office";
  }

  const params = new URLSearchParams(
    window.location.search,
  );

  const requestedPath =
    params.get("returnTo");

  if (
    !requestedPath ||
    !requestedPath.startsWith("/") ||
    requestedPath.startsWith("//")
  ) {
    return "/office";
  }

  return requestedPath;
}

function readProfileMetadata(
  metadata: Record<string, unknown> | undefined,
): UserProfile {
  return {
    displayName:
      typeof metadata?.display_name === "string"
        ? metadata.display_name
        : "",
    role:
      typeof metadata?.role === "string"
        ? (metadata.role as ProfileRole)
        : "community-member",
    generalLocation:
      typeof metadata?.general_location === "string"
        ? metadata.general_location
        : "",
    about:
      typeof metadata?.about === "string"
        ? metadata.about
        : "",
    accessPurpose:
      typeof metadata?.access_purpose === "string"
        ? metadata.access_purpose
        : "",
  };
}

export default function SignInPage() {
  const router = useRouter();

  const [mode, setMode] =
    useState<Mode>("sign-in");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [signedInEmail, setSignedInEmail] =
    useState<string | null>(null);

  const [profile, setProfile] =
    useState<UserProfile>(EMPTY_PROFILE);

  const [profileSaved, setProfileSaved] =
    useState(false);

  useEffect(() => {
    const supabase =
      getSupabaseBrowserClient();

    let active = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) {
          return;
        }

        const user = data.user;

        setSignedInEmail(
          user?.email ?? null,
        );

        setProfile(
          readProfileMetadata(
            user?.user_metadata,
          ),
        );
      });

    const {
      data: subscription,
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;

        setSignedInEmail(
          user?.email ?? null,
        );

        setProfile(
          user
            ? readProfileMetadata(
                user.user_metadata,
              )
            : EMPTY_PROFILE,
        );
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanedEmail =
      email.trim().toLowerCase();

    if (!cleanedEmail) {
      setMessage(
        "Enter your email address.",
      );
      return;
    }

    if (password.length < 8) {
      setMessage(
        "Use a password with at least 8 characters.",
      );
      return;
    }

    setBusy(true);
    setMessage("");
    setProfileSaved(false);

    try {
      const supabase =
        getSupabaseBrowserClient();

      if (mode === "sign-up") {
        const { data, error } =
          await supabase.auth.signUp({
            email: cleanedEmail,
            password,
          });

        if (error) {
          throw error;
        }

        if (data.session) {
          setMessage(
            "Your account has been created. Complete your profile below.",
          );
        } else {
          setMessage(
            "Your account has been created. Check your email and confirm your address before signing in.",
          );
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword(
            {
              email: cleanedEmail,
              password,
            },
          );

        if (error) {
          throw error;
        }

        setMessage(
          "You are signed in.",
        );

        router.replace(
          getSafeReturnTo(),
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Authentication failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!profile.displayName.trim()) {
      setMessage(
        "Enter the name you would like shown in the app.",
      );
      return;
    }

    setBusy(true);
    setMessage("");
    setProfileSaved(false);

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

      setProfile(
        readProfileMetadata(
          data.user.user_metadata,
        ),
      );

      setProfileSaved(true);
      setMessage(
        "Your profile has been saved.",
      );

      window.setTimeout(() => {
        router.replace(
          getSafeReturnTo(),
        );
      }, 500);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your profile.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setMessage("");
    setProfileSaved(false);

    try {
      const supabase =
        getSupabaseBrowserClient();

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setProfile(EMPTY_PROFILE);
      setMessage(
        "You are signed out.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign out.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm sm:p-9">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
            Smiling Monad
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Access and profile
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-black/65">
            Create a secure account, build a simple profile and enter the Smiling Monad Space.
          </p>

          {signedInEmail ? (
            <div className="mt-7 space-y-6">
              <section className="rounded-3xl border border-[#b8c7a8] bg-[#eef3e8] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-black/45">
                  Signed in
                </p>

                <p className="mt-2 break-all text-lg font-semibold">
                  {signedInEmail}
                </p>
              </section>

              <form
                onSubmit={saveProfile}
                className="rounded-[1.75rem] border border-black/10 bg-white/75 p-5 sm:p-6"
              >
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-black/45">
                    Your profile
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Help Kimi understand who you are
                  </h2>

                  <p className="mt-3 leading-7 text-black/60">
                    These details stay attached to your secure account and can guide your experience in the app.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-semibold">
                      Name shown in the app
                    </span>

                    <input
                      value={profile.displayName}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          displayName:
                            event.target.value,
                        }))
                      }
                      placeholder="Your preferred name"
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
                        setProfile((current) => ({
                          ...current,
                          role:
                            event.target.value as ProfileRole,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                    >
                      <option value="participant">
                        Participant
                      </option>
                      <option value="family">
                        Family member
                      </option>
                      <option value="support-worker">
                        Support worker
                      </option>
                      <option value="provider">
                        Provider
                      </option>
                      <option value="professional">
                        Professional
                      </option>
                      <option value="community-member">
                        Community member
                      </option>
                      <option value="other">
                        Other
                      </option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold">
                      General location
                    </span>

                    <input
                      value={profile.generalLocation}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          generalLocation:
                            event.target.value,
                        }))
                      }
                      placeholder="Town or region"
                      className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-sm font-semibold">
                      About you
                    </span>

                    <textarea
                      value={profile.about}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          about:
                            event.target.value,
                        }))
                      }
                      placeholder="A short introduction, interests or anything useful for Kimi to understand"
                      className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-black/15 bg-white px-4 py-3 leading-7 outline-none focus:border-black/40"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-sm font-semibold">
                      What would you like help with?
                    </span>

                    <textarea
                      value={profile.accessPurpose}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          accessPurpose:
                            event.target.value,
                        }))
                      }
                      placeholder="What you would like to explore or practise in the Smiling Monad Space"
                      className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-black/15 bg-white px-4 py-3 leading-7 outline-none focus:border-black/40"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-6 w-full rounded-full bg-[#2c2a26] px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {busy
                    ? "Saving…"
                    : "Save profile"}
                </button>

                {profileSaved ? (
                  <p className="mt-3 text-center text-sm font-medium text-[#4f6650]">
                    Profile ready.
                  </p>
                ) : null}
              </form>

              <div className="grid gap-3 sm:grid-cols-3">
                <Link
                  href="/office"
                  className="rounded-full bg-[#2c2a26] px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  Enter the Space
                </Link>

                <Link
                  href="/circle"
                  className="rounded-full border border-black/15 bg-white px-5 py-3 text-center text-sm font-semibold"
                >
                  Open Circle Centre
                </Link>

                <button
                  type="button"
                  onClick={signOut}
                  disabled={busy}
                  className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-semibold disabled:opacity-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-7 grid grid-cols-2 rounded-full bg-black/5 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setMode("sign-in")
                  }
                  className={`rounded-full px-4 py-3 text-sm font-semibold ${
                    mode === "sign-in"
                      ? "bg-white shadow-sm"
                      : "text-black/55"
                  }`}
                >
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMode("sign-up")
                  }
                  className={`rounded-full px-4 py-3 text-sm font-semibold ${
                    mode === "sign-up"
                      ? "bg-white shadow-sm"
                      : "text-black/55"
                  }`}
                >
                  Create account
                </button>
              </div>

              <form
                onSubmit={submit}
                className="mt-6 space-y-4"
              >
                <label className="block">
                  <span className="text-sm font-semibold">
                    Email address
                  </span>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    autoComplete="email"
                    className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">
                    Password
                  </span>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    autoComplete={
                      mode === "sign-up"
                        ? "new-password"
                        : "current-password"
                    }
                    className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-[#2c2a26] px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {busy
                    ? "Please wait…"
                    : mode === "sign-up"
                      ? "Create secure account"
                      : "Sign in"}
                </button>
              </form>
            </>
          )}

          {message ? (
            <p className="mt-5 rounded-2xl bg-black/5 px-4 py-3 text-sm leading-6">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}