"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

function getSafeReturnTo(): string {
  if (typeof window === "undefined") {
    return "/office";
  }

  const requestedPath =
    new URLSearchParams(
      window.location.search,
    ).get("returnTo");

  if (
    !requestedPath ||
    !requestedPath.startsWith("/") ||
    requestedPath.startsWith("//")
  ) {
    return "/office";
  }

  return requestedPath;
}

export default function SignInPage() {
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

  const [checking, setChecking] =
    useState(true);

  const [configurationError, setConfigurationError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function checkConfiguration() {
      try {
        const supabase =
          getSupabaseBrowserClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) {
          return;
        }

        if (user) {
          window.location.replace(
            getSafeReturnTo(),
          );
          return;
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setConfigurationError(
          error instanceof Error
            ? error.message
            : "Secure sign-in is temporarily unavailable.",
        );
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    void checkConfiguration();

    return () => {
      active = false;
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

    try {
      const supabase =
        getSupabaseBrowserClient();

      if (mode === "sign-up") {
        const { data, error } =
          await supabase.auth.signUp({
            email: cleanedEmail,
            password,
            options: {
              emailRedirectTo:
                `${window.location.origin}/sign-in`,
            },
          });

        if (error) {
          throw error;
        }

        if (data.session) {
          window.location.replace(
            "/profile",
          );
          return;
        }

        setMessage(
          "Account created. Check your email to confirm it, then return here to sign in.",
        );
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

        window.location.replace(
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

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 text-[#2c2a26]">
        <div className="rounded-3xl border border-black/10 bg-white/85 px-7 py-6 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/45">
            Smiling Monad
          </p>

          <p className="mt-3 text-lg font-semibold">
            Opening secure access…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="w-full max-w-xl rounded-[2rem] border border-black/10 bg-white/85 p-7 shadow-sm sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/45">
          Smiling Monad
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Secure access
        </h1>

        <p className="mt-4 leading-7 text-black/65">
          Sign in to enter the Smiling Monad Space, or create a new practice account.
        </p>

        {configurationError ? (
          <section className="mt-6 rounded-3xl border border-[#d4b18d] bg-[#fff4e8] p-5">
            <p className="font-semibold">
              Secure sign-in could not start.
            </p>

            <p className="mt-3 break-words text-sm leading-6 text-black/65">
              {configurationError}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.replace(
                  "/office",
                )
              }
              className="mt-5 w-full rounded-full bg-[#2c2a26] px-5 py-3 font-semibold text-white"
            >
              Open the Space temporarily
            </button>
          </section>
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
    </main>
  );
}